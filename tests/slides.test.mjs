// tests/slides.test.mjs
// Chạy: npm test
// Khoá banner trang chủ: thứ tự, bật/tắt, kiểm tra chữ và liên kết, giới hạn số slide, kích thước ảnh tối thiểu,
// nhật ký; và phân mục bài đăng (mặc định, đổi mục, lọc, đếm).
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { openDb } from "../src/server/db.ts";
import { SLIDES_POLICY } from "../src/server/policy.ts";
import { listAudit } from "../src/server/auth.ts";
import {
  SlideError, createSlide, deleteSlide, isSafeLink, listEnabledSlides, listSlides, moveSlide, setSlideEnabled, updateSlide,
} from "../src/server/slides.ts";
import { UploadError, processSlideImage } from "../src/server/uploads.ts";
import { countPublished, createPost, listPublished, setPublished, updatePost } from "../src/server/posts.ts";

const actor = { id: 1, username: "nv.lan" };
const T0 = 1_800_000_000_000;
const text = (over = {}) => ({ title: "Khai giảng", text: "Đăng ký sớm", link: "/news", alt: "", ...over });
const file = (n) => `${String(n).repeat(32).slice(0, 32)}.webp`;
const png = (width, height, extra = {}) =>
  sharp({ create: { width, height, channels: 3, background: "#184268" }, ...extra }).png().toBuffer();

test("slide mới xếp cuối, bật sẵn; thứ tự đổi được lên/xuống và luôn liên tục", () => {
  const db = openDb(":memory:");
  const a = createSlide(db, file(1), text({ title: "A" }), actor, T0);
  const b = createSlide(db, file(2), text({ title: "B" }), actor, T0);
  const c = createSlide(db, file(3), text({ title: "C" }), actor, T0);
  assert.deepEqual(listSlides(db).map((s) => s.title), ["A", "B", "C"]);
  assert.ok(listSlides(db).every((s) => s.enabled));
  moveSlide(db, c.id, -1, actor, T0 + 1);
  assert.deepEqual(listSlides(db).map((s) => s.title), ["A", "C", "B"]);
  moveSlide(db, a.id, -1, actor, T0 + 2); // đã ở đầu: không đổi
  moveSlide(db, b.id, 1, actor, T0 + 3); // đã ở cuối: không đổi
  assert.deepEqual(listSlides(db).map((s) => s.title), ["A", "C", "B"]);
  assert.deepEqual(listSlides(db).map((s) => s.position), [0, 1, 2]);
});

test("slide tắt không hiện ra trang chủ nhưng vẫn còn trong quản trị", () => {
  const db = openDb(":memory:");
  const a = createSlide(db, file(1), text({ title: "A" }), actor, T0);
  createSlide(db, file(2), text({ title: "B" }), actor, T0);
  setSlideEnabled(db, a.id, false, actor, T0 + 1);
  assert.deepEqual(listEnabledSlides(db).map((s) => s.title), ["B"]);
  assert.equal(listSlides(db).length, 2);
  setSlideEnabled(db, a.id, true, actor, T0 + 2);
  assert.equal(listEnabledSlides(db).length, 2);
});

test("kiểm tra chữ: quá dài, thiếu mô tả khi không có tiêu đề, liên kết nguy hiểm", () => {
  const db = openDb(":memory:");
  assert.throws(() => createSlide(db, file(1), text({ title: "x".repeat(SLIDES_POLICY.titleMax + 1) }), actor), (e) => e instanceof SlideError && e.code === "title");
  assert.throws(() => createSlide(db, file(1), text({ title: "", alt: "" }), actor), (e) => e.code === "alt");
  assert.doesNotThrow(() => createSlide(db, file(1), text({ title: "", text: "", link: "", alt: "Ảnh lớp học" }), actor));
  for (const link of ["javascript:alert(1)", "//evil.example", "http://khong-an-toan.vn", "data:text/html,x", "news", "/ có cách"])
    assert.throws(() => createSlide(db, file(2), text({ link }), actor), (e) => e.code === "link", link);
  for (const link of ["", "/news", "/#pricing", "https://www.facebook.com/global.chesss"]) assert.equal(isSafeLink(link), true, link);
});

test("tối đa số slide cho phép", () => {
  const db = openDb(":memory:");
  for (let i = 0; i < SLIDES_POLICY.maxSlides; i++) createSlide(db, file(i), text(), actor, T0);
  assert.throws(() => createSlide(db, file(9), text(), actor), (e) => e.code === "too_many");
});

test("sửa chữ, xoá trả về tên file để xoá ảnh thật, và mọi thay đổi đều vào nhật ký", () => {
  const db = openDb(":memory:");
  const a = createSlide(db, file(1), text({ title: "A" }), actor, T0);
  updateSlide(db, a.id, text({ title: "A mới" }), actor, T0 + 1);
  assert.equal(listSlides(db)[0].title, "A mới");
  assert.equal(listSlides(db)[0].file, file(1), "sửa chữ không đổi ảnh");
  assert.equal(deleteSlide(db, a.id, actor, T0 + 2), file(1));
  assert.equal(listSlides(db).length, 0);
  assert.throws(() => updateSlide(db, 999, text(), actor), (e) => e.code === "not_found");
  const actions = listAudit(db, 10).map((r) => r.action);
  for (const expected of ["slide_created", "slide_updated", "slide_deleted"]) assert.ok(actions.includes(expected), expected);
});

test("ảnh banner nhỏ hơn mức tối thiểu bị từ chối, đủ lớn thì được thu về 1600px webp", async () => {
  await assert.rejects(processSlideImage(await png(800, 450)), (e) => e instanceof UploadError && /1600×900/.test(e.message));
  await assert.rejects(processSlideImage(await png(1600, 600)), UploadError, "đủ rộng nhưng thấp hơn 900");
  const out = await processSlideImage(await png(2400, 1350));
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, SLIDES_POLICY.minWidth);
});

test("ảnh dọc xoay theo EXIF được tính theo chiều nhìn thấy", async () => {
  // 900×1600 gắn cờ xoay 90° trông như 1600×900: phải được nhận.
  const rotated = await sharp(await png(900, 1600)).withMetadata({ orientation: 6 }).jpeg().toBuffer();
  await assert.doesNotReject(processSlideImage(rotated));
});

test("bài mới mặc định thuộc mục Tin tức; đổi mục, lọc và đếm theo mục", () => {
  const db = openDb(":memory:");
  const base = { summary: "", body: "Nội dung" };
  const news = createPost(db, { ...base, title: "Tin A" }, actor, T0);
  const know = createPost(db, { ...base, title: "Kiến thức B", category: "knowledge" }, actor, T0);
  assert.equal(news.category, "news");
  assert.equal(know.category, "knowledge");
  setPublished(db, news.id, true, actor, T0 + 1);
  setPublished(db, know.id, true, actor, T0 + 2);
  assert.equal(countPublished(db), 2);
  assert.equal(countPublished(db, "news"), 1);
  assert.deepEqual(listPublished(db, 1, 12, "knowledge").map((p) => p.title), ["Kiến thức B"]);
  assert.equal(listPublished(db, 1, 12).length, 2);
  assert.equal(updatePost(db, news.id, { ...base, title: "Tin A", category: "knowledge" }, actor, T0 + 3).category, "knowledge");
  assert.equal(countPublished(db, "news"), 0);
  assert.throws(() => createPost(db, { ...base, title: "X", category: "khac" }, actor), (e) => e.code === "category");
});

test("cột category có mặc định là Tin tức, nên bài chèn không khai mục (như bài cũ) vẫn hợp lệ", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { migrate } = await import("../src/server/db.ts");
  const db = new DatabaseSync(":memory:");
  migrate(db);
  db.prepare("INSERT INTO posts (slug,title,summary,body,status,created_at,updated_at) VALUES ('a','A','','x','draft',1,1)").run();
  assert.equal(db.prepare("SELECT category FROM posts").get().category, "news");
});
