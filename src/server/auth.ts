// src/server/auth.ts
//
// Tài khoản, phiên đăng nhập, chống dò mật khẩu và nhật ký thay đổi của trang quản trị.
// Chỉ dùng cú pháp TypeScript "xoá kiểu được" (không enum) để `node --test` chạy thẳng.
// Mọi hàm nhận `db` và `now` làm tham số để test được mà không cần đồng hồ thật.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Db } from "./db.ts";
import { AUTH_POLICY } from "./policy.ts";

export type Role = "admin" | "editor";

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  role: Role;
}

export interface UserRow extends SessionUser {
  active: boolean;
  createdAt: number;
  lastLoginAt: number | null;
}

export class AuthError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ---------- Mật khẩu ----------

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  const actual = scryptSync(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// Tên đăng nhập không tồn tại vẫn phải tốn thời gian băm như tên có thật,
// nếu không kẻ dò đoán được tên nào có tài khoản qua độ trễ.
let dummyHash: string | undefined;
function burnPasswordTime(password: string): void {
  dummyHash ??= hashPassword("khong-ai-biet-mat-khau-nay");
  verifyPassword(password, dummyHash);
}

export function checkPasswordStrength(password: string): string | null {
  if (password.length < AUTH_POLICY.minPasswordLength) {
    return `Mật khẩu cần ít nhất ${AUTH_POLICY.minPasswordLength} ký tự.`;
  }
  return null;
}

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

// ---------- Nhật ký ----------

export interface Actor {
  id: number | null;
  username: string | null;
}

export function audit(
  db: Db,
  actor: Actor | null,
  action: string,
  target: string | null = null,
  detail: Record<string, unknown> | null = null,
  now: number = Date.now(),
): void {
  db.prepare(
    "INSERT INTO audit_log (at, user_id, username, action, target, detail) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(now, actor?.id ?? null, actor?.username ?? null, action, target, detail ? JSON.stringify(detail) : null);
}

export interface AuditRow {
  id: number;
  at: number;
  username: string | null;
  action: string;
  target: string | null;
  detail: Record<string, unknown> | null;
}

export function listAudit(db: Db, limit = 200): AuditRow[] {
  const rows = db
    .prepare("SELECT id, at, username, action, target, detail FROM audit_log ORDER BY id DESC LIMIT ?")
    .all(limit) as Array<Omit<AuditRow, "detail"> & { detail: string | null }>;
  return rows.map((row) => ({ ...row, detail: row.detail ? JSON.parse(row.detail) : null }));
}

// ---------- Tài khoản ----------

interface RawUser {
  id: number;
  username: string;
  display_name: string;
  role: Role;
  active: number;
  created_at: number;
  last_login_at: number | null;
}

const toUserRow = (row: RawUser): UserRow => ({
  id: row.id,
  username: row.username,
  displayName: row.display_name,
  role: row.role,
  active: row.active === 1,
  createdAt: row.created_at,
  lastLoginAt: row.last_login_at,
});

export function listUsers(db: Db): UserRow[] {
  const rows = db
    .prepare(
      "SELECT id, username, display_name, role, active, created_at, last_login_at FROM users ORDER BY role, username",
    )
    .all() as unknown as RawUser[];
  return rows.map(toUserRow);
}

export function countUsers(db: Db): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
}

function countOtherActiveAdmins(db: Db, exceptUserId: number): number {
  return (
    db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id <> ?")
      .get(exceptUserId) as { n: number }
  ).n;
}

export interface NewUser {
  username: string;
  displayName: string;
  password: string;
  role: Role;
}

export function createUser(db: Db, input: NewUser, actor: Actor | null, now: number = Date.now()): number {
  const username = normalizeUsername(input.username);
  const displayName = input.displayName.trim();
  if (!USERNAME_PATTERN.test(username)) {
    throw new AuthError("username", "Tên đăng nhập gồm 3–32 ký tự: chữ thường, số, dấu chấm, gạch ngang hoặc gạch dưới.");
  }
  if (displayName === "") throw new AuthError("display_name", "Cần nhập tên hiển thị.");
  if (input.role !== "admin" && input.role !== "editor") throw new AuthError("role", "Quyền không hợp lệ.");
  const weak = checkPasswordStrength(input.password);
  if (weak) throw new AuthError("password", weak);
  if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) {
    throw new AuthError("exists", "Tên đăng nhập này đã có người dùng.");
  }
  const result = db
    .prepare("INSERT INTO users (username, display_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(username, displayName, hashPassword(input.password), input.role, now);
  const id = Number(result.lastInsertRowid);
  audit(db, actor, "user_created", username, { role: input.role }, now);
  return id;
}

export function resetPassword(db: Db, userId: number, password: string, actor: Actor, now: number = Date.now()): void {
  const weak = checkPasswordStrength(password);
  if (weak) throw new AuthError("password", weak);
  const user = db.prepare("SELECT username FROM users WHERE id = ?").get(userId) as { username: string } | undefined;
  if (!user) throw new AuthError("not_found", "Không tìm thấy tài khoản.");
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), userId);
  // Đổi mật khẩu thì mọi thiết bị đang đăng nhập bằng mật khẩu cũ phải đăng nhập lại.
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  audit(db, actor, "password_reset", user.username, null, now);
}

// Luôn còn ít nhất một quản trị đang hoạt động, nếu không không ai vào được trang này nữa.
export function setActive(db: Db, userId: number, active: boolean, actor: Actor, now: number = Date.now()): void {
  const user = db.prepare("SELECT username, role FROM users WHERE id = ?").get(userId) as
    | { username: string; role: Role }
    | undefined;
  if (!user) throw new AuthError("not_found", "Không tìm thấy tài khoản.");
  if (!active && user.role === "admin" && countOtherActiveAdmins(db, userId) === 0) {
    throw new AuthError("last_admin", "Đây là quản trị cuối cùng đang hoạt động, không thể khoá.");
  }
  db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, userId);
  if (!active) db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  audit(db, actor, active ? "user_activated" : "user_deactivated", user.username, null, now);
}

export function setRole(db: Db, userId: number, role: Role, actor: Actor, now: number = Date.now()): void {
  const user = db.prepare("SELECT username, role FROM users WHERE id = ?").get(userId) as
    | { username: string; role: Role }
    | undefined;
  if (!user) throw new AuthError("not_found", "Không tìm thấy tài khoản.");
  if (user.role === "admin" && role !== "admin" && countOtherActiveAdmins(db, userId) === 0) {
    throw new AuthError("last_admin", "Đây là quản trị cuối cùng đang hoạt động, không thể hạ quyền.");
  }
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
  audit(db, actor, "role_changed", user.username, { from: user.role, to: role }, now);
}

// ---------- Đăng nhập và phiên ----------

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export type LoginResult =
  | { ok: true; token: string; expiresAt: number; user: SessionUser }
  | { ok: false; reason: "invalid" | "locked" };

export function login(
  db: Db,
  input: { username: string; password: string; ip: string },
  now: number = Date.now(),
): LoginResult {
  const username = normalizeUsername(input.username);
  const windowStart = now - AUTH_POLICY.lockoutMinutes * 60_000;

  const failuresFor = (column: "username" | "ip", value: string) =>
    (
      db.prepare(`SELECT COUNT(*) AS n FROM login_failures WHERE ${column} = ? AND at > ?`).get(value, windowStart) as {
        n: number;
      }
    ).n;

  if (
    failuresFor("username", username) >= AUTH_POLICY.maxFailuresPerUsername ||
    failuresFor("ip", input.ip) >= AUTH_POLICY.maxFailuresPerIp
  ) {
    return { ok: false, reason: "locked" };
  }

  const row = db
    .prepare("SELECT id, username, display_name, password_hash, role, active FROM users WHERE username = ?")
    .get(username) as
    | { id: number; username: string; display_name: string; password_hash: string; role: Role; active: number }
    | undefined;

  const valid = row ? verifyPassword(input.password, row.password_hash) : (burnPasswordTime(input.password), false);

  if (!row || !valid || row.active !== 1) {
    db.prepare("INSERT INTO login_failures (username, ip, at) VALUES (?, ?, ?)").run(username, input.ip, now);
    audit(db, { id: null, username }, "login_failed", null, { ip: input.ip }, now);
    return { ok: false, reason: "invalid" };
  }

  db.prepare("DELETE FROM login_failures WHERE username = ?").run(username);
  db.prepare("DELETE FROM login_failures WHERE at <= ?").run(windowStart);
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);

  const token = randomBytes(32).toString("base64url");
  const expiresAt = now + AUTH_POLICY.sessionHours * 3_600_000;
  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    sha256(token),
    row.id,
    now,
    expiresAt,
  );
  db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(now, row.id);

  const user: SessionUser = { id: row.id, username: row.username, displayName: row.display_name, role: row.role };
  audit(db, user, "login", null, { ip: input.ip }, now);
  return { ok: true, token, expiresAt, user };
}

// Trong DB chỉ lưu băm của mã phiên: lộ file DB cũng không dùng lại được cookie.
export function getSessionUser(db: Db, token: string, now: number = Date.now()): SessionUser | null {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(sha256(token), now) as { id: number; username: string; display_name: string; role: Role } | undefined;
  return row ? { id: row.id, username: row.username, displayName: row.display_name, role: row.role } : null;
}

export function logout(db: Db, token: string, actor: Actor | null, now: number = Date.now()): void {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  if (actor) audit(db, actor, "logout", null, null, now);
}
