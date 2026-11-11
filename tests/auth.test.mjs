// tests/auth.test.mjs
// Chạy: npm test   (node --test)
//
// Khóa các quy tắc của trang quản trị: mật khẩu, khoá tạm khi sai nhiều lần, hết hạn phiên,
// luôn còn một quản trị, và nhật ký. Thông số lấy từ `src/server/policy.ts`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/server/db.ts";
import { AUTH_POLICY } from "../src/server/policy.ts";
import {
  AuthError,
  createUser,
  getSessionUser,
  hashPassword,
  listAudit,
  listUsers,
  login,
  logout,
  resetPassword,
  setActive,
  setRole,
  verifyPassword,
} from "../src/server/auth.ts";

const PASSWORD = "mat-khau-du-dai-1";
const T0 = 1_800_000_000_000;
const MIN = 60_000;

function freshDb() {
  const db = openDb(":memory:");
  const adminId = createUser(db, { username: "Quan.Tri", displayName: "Quản trị", password: PASSWORD, role: "admin" }, null, T0);
  return { db, adminId, actor: { id: adminId, username: "quan.tri" } };
}

const attempt = (db, username, password, now, ip = "1.1.1.1") => login(db, { username, password, ip }, now);

test("băm mật khẩu: đúng thì khớp, sai thì không, mỗi lần băm một muối khác", () => {
  const a = hashPassword("abc");
  const b = hashPassword("abc");
  assert.notEqual(a, b);
  assert.equal(verifyPassword("abc", a), true);
  assert.equal(verifyPassword("abd", a), false);
  assert.equal(verifyPassword("abc", "khong-phai-bam"), false);
});

test("tạo tài khoản: tên đăng nhập chuẩn hoá chữ thường, và bị chặn khi trùng, ngắn hoặc mật khẩu yếu", () => {
  const { db, actor } = freshDb();
  assert.equal(listUsers(db)[0].username, "quan.tri");
  const bad = (input) => assert.throws(() => createUser(db, input, actor), AuthError);
  bad({ username: "QUAN.TRI", displayName: "Trùng", password: PASSWORD, role: "editor" });
  bad({ username: "ab", displayName: "Ngắn", password: PASSWORD, role: "editor" });
  bad({ username: "co khoang trang", displayName: "Sai", password: PASSWORD, role: "editor" });
  bad({ username: "nv.moi", displayName: "Yếu", password: "ngan", role: "editor" });
  bad({ username: "nv.moi", displayName: "Sai quyền", password: PASSWORD, role: "root" });
});

test("đăng nhập đúng: có phiên, và tên đăng nhập không phân biệt hoa thường", () => {
  const { db } = freshDb();
  const result = attempt(db, "  QUAN.TRI ", PASSWORD, T0 + MIN);
  assert.equal(result.ok, true);
  assert.equal(result.user.role, "admin");
  assert.equal(getSessionUser(db, result.token, T0 + MIN)?.username, "quan.tri");
});

test("đăng nhập sai: tên không có và mật khẩu sai trả cùng một kết quả", () => {
  const { db } = freshDb();
  assert.deepEqual(attempt(db, "khong.co", PASSWORD, T0), { ok: false, reason: "invalid" });
  assert.deepEqual(attempt(db, "quan.tri", "sai-mat-khau-1", T0), { ok: false, reason: "invalid" });
});

test("sai quá số lần cho một tên thì bị khoá, kể cả khi sau đó gõ đúng", () => {
  const { db } = freshDb();
  for (let i = 0; i < AUTH_POLICY.maxFailuresPerUsername; i++) attempt(db, "quan.tri", "sai-mat-khau-1", T0 + i);
  assert.deepEqual(attempt(db, "quan.tri", PASSWORD, T0 + 10_000), { ok: false, reason: "locked" });
});

test("hết thời gian khoá thì đăng nhập lại được", () => {
  const { db } = freshDb();
  for (let i = 0; i < AUTH_POLICY.maxFailuresPerUsername; i++) attempt(db, "quan.tri", "sai-mat-khau-1", T0 + i);
  const later = T0 + (AUTH_POLICY.lockoutMinutes + 1) * MIN;
  assert.equal(attempt(db, "quan.tri", PASSWORD, later).ok, true);
});

test("khoá theo IP: một IP thử quá nhiều tên khác nhau thì bị chặn", () => {
  const { db } = freshDb();
  for (let i = 0; i < AUTH_POLICY.maxFailuresPerIp; i++) attempt(db, `ten.gia.${i}`, "sai-mat-khau-1", T0 + i, "9.9.9.9");
  assert.deepEqual(attempt(db, "quan.tri", PASSWORD, T0 + 5000, "9.9.9.9"), { ok: false, reason: "locked" });
  assert.equal(attempt(db, "quan.tri", PASSWORD, T0 + 5000, "8.8.8.8").ok, true);
});

test("đăng nhập đúng xoá số lần sai đã đếm", () => {
  const { db } = freshDb();
  for (let i = 0; i < AUTH_POLICY.maxFailuresPerUsername - 1; i++) attempt(db, "quan.tri", "sai-mat-khau-1", T0 + i);
  assert.equal(attempt(db, "quan.tri", PASSWORD, T0 + 1000).ok, true);
  for (let i = 0; i < AUTH_POLICY.maxFailuresPerUsername - 1; i++) attempt(db, "quan.tri", "sai-mat-khau-1", T0 + 2000 + i);
  assert.equal(attempt(db, "quan.tri", PASSWORD, T0 + 3000).ok, true);
});

test("phiên hết hạn sau số giờ quy định và đăng xuất thu hồi phiên", () => {
  const { db, actor } = freshDb();
  const { token } = attempt(db, "quan.tri", PASSWORD, T0);
  const justBefore = T0 + AUTH_POLICY.sessionHours * 60 * MIN - 1;
  assert.notEqual(getSessionUser(db, token, justBefore), null);
  assert.equal(getSessionUser(db, token, justBefore + 2), null);

  const second = attempt(db, "quan.tri", PASSWORD, T0 + MIN);
  logout(db, second.token, actor, T0 + 2 * MIN);
  assert.equal(getSessionUser(db, second.token, T0 + 2 * MIN), null);
  assert.equal(getSessionUser(db, "", T0), null);
});

test("DB chỉ lưu băm của mã phiên, không lưu mã thật", () => {
  const { db } = freshDb();
  const { token } = attempt(db, "quan.tri", PASSWORD, T0);
  const stored = db.prepare("SELECT id FROM sessions").all().map((r) => r.id);
  assert.equal(stored.includes(token), false);
});

test("khoá tài khoản: không đăng nhập được và phiên đang có bị thu hồi", () => {
  const { db, actor } = freshDb();
  const editorId = createUser(db, { username: "nv.lan", displayName: "Lan", password: PASSWORD, role: "editor" }, actor, T0);
  const { token } = attempt(db, "nv.lan", PASSWORD, T0);
  setActive(db, editorId, false, actor, T0 + MIN);
  assert.equal(getSessionUser(db, token, T0 + MIN), null);
  assert.deepEqual(attempt(db, "nv.lan", PASSWORD, T0 + 2 * MIN), { ok: false, reason: "invalid" });
  setActive(db, editorId, true, actor, T0 + 3 * MIN);
  assert.equal(attempt(db, "nv.lan", PASSWORD, T0 + 4 * MIN).ok, true);
});

test("đặt lại mật khẩu: mật khẩu cũ hết hiệu lực và mọi phiên cũ bị thu hồi", () => {
  const { db, actor } = freshDb();
  const editorId = createUser(db, { username: "nv.lan", displayName: "Lan", password: PASSWORD, role: "editor" }, actor, T0);
  const { token } = attempt(db, "nv.lan", PASSWORD, T0);
  resetPassword(db, editorId, "mat-khau-moi-123", actor, T0 + MIN);
  assert.equal(getSessionUser(db, token, T0 + MIN), null);
  assert.equal(attempt(db, "nv.lan", PASSWORD, T0 + 2 * MIN).ok, false);
  assert.equal(attempt(db, "nv.lan", "mat-khau-moi-123", T0 + 3 * MIN).ok, true);
  assert.throws(() => resetPassword(db, editorId, "ngan", actor), AuthError);
});

test("luôn còn một quản trị đang hoạt động: không khoá hay hạ quyền người cuối", () => {
  const { db, adminId, actor } = freshDb();
  assert.throws(() => setActive(db, adminId, false, actor), (e) => e.code === "last_admin");
  assert.throws(() => setRole(db, adminId, "editor", actor), (e) => e.code === "last_admin");

  const second = createUser(db, { username: "quan.tri2", displayName: "Quản trị 2", password: PASSWORD, role: "admin" }, actor, T0);
  setRole(db, adminId, "editor", actor, T0 + MIN);
  assert.throws(() => setActive(db, second, false, actor), (e) => e.code === "last_admin");
});

test("nhật ký ghi lại đăng nhập, đăng nhập sai và thay đổi tài khoản, kèm người thực hiện", () => {
  const { db, actor } = freshDb();
  attempt(db, "quan.tri", "sai-mat-khau-1", T0 + 1);
  attempt(db, "quan.tri", PASSWORD, T0 + 2);
  const editorId = createUser(db, { username: "nv.lan", displayName: "Lan", password: PASSWORD, role: "editor" }, actor, T0 + 3);
  setRole(db, editorId, "admin", actor, T0 + 4);

  const log = listAudit(db);
  assert.deepEqual(
    log.map((r) => r.action),
    ["role_changed", "user_created", "login", "login_failed", "user_created"],
  );
  assert.equal(log[0].username, "quan.tri");
  assert.deepEqual(log[0].detail, { from: "editor", to: "admin" });
  assert.equal(log[0].target, "nv.lan");
  assert.equal(JSON.stringify(log).includes(PASSWORD), false);
});
