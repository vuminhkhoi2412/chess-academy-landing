// tests/posts.test.mjs
// Chạy: npm test
// Khóa hành vi bài đăng: slug tiếng Việt, nháp không lộ ra công khai, ảnh bìa, giới hạn, và xử lý ảnh tải lên.
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { openDb } from "../src/server/db.ts";
import { POSTS_POLICY } from "../src/server/policy.ts";
import { listAudit } from "../src/server/auth.ts";
import {
  PostError, addImage, countPublished, createPost, deletePost, getPublishedBySlug, listImages,
  listPublished, parseBody, removeImage, setCover, setPublished, slugify, updatePost,
} from "../src/server/posts.ts";
import { UploadError, isUploadName, processImage } from "../src/server/uploads.ts";
import { RateLimiter } from "../src/server/rate-limit.ts";

const actor = { id: 1, username: "nv.lan" };
const T0 = 1_800_000_000_000;
const input = (over = {}) => ({ title: "Giải cờ vua mùa hè 2026!", summary: "Tóm tắt", body: "Nội dung", ...over });

test("slug bỏ dấu tiếng Việt, và trùng tiêu đề thì thêm số", () => {
  assert.equal(slugify("Giải cờ vua mùa hè 2026!"), "giai-co-vua-mua-he-2026");
  assert.equal(slugify("Đại hội Đồng đội"), "dai-hoi-dong-doi");
  assert.equal(slugify("!!!"), "bai-viet");
  const db = openDb(":memory:");
  assert.equal(createPost(db, input(), actor, T0).slug, "giai-co-vua-mua-he-2026");
  assert.equal(createPost(db, input(), actor, T0).slug, "giai-co-vua-mua-he-2026-2");
});

test("bài mới là nháp và không lộ ra công khai cho đến khi đăng", () => {
  const db = openDb(":memory:");
  const post = createPost(db, input(), actor, T0);
  assert.equal(post.status, "draft");
  assert.equal(getPublishedBySlug(db, post.slug), null);
  assert.equal(countPublished(db), 0);
  setPublished(db, post.id, true, actor, T0 + 1);
  assert.equal(getPublishedBySlug(db, post.slug)?.title, post.title);
  setPublished(db, post.id, false, actor, T0 + 2);
  assert.equal(getPublishedBySlug(db, post.slug), null);
});

test("gỡ rồi đăng lại giữ nguyên giờ đăng đầu tiên; sửa tiêu đề giữ nguyên slug", () => {
  const db = openDb(":memory:");
  const post = createPost(db, input(), actor, T0);
  setPublished(db, post.id, true, actor, T0 + 10);
  setPublished(db, post.id, false, actor, T0 + 20);
  setPublished(db, post.id, true, actor, T0 + 30);
  const updated = updatePost(db, post.id, input({ title: "Tiêu đề khác hẳn" }), actor, T0 + 40);
  assert.equal(updated.slug, post.slug);
  assert.equal(updated.publishedAt, T0 + 10);
});

test("không đăng được bài rỗng; kiểm tra độ dài và tiêu đề", () => {
  const db = openDb(":memory:");
  const post = createPost(db, input({ body: "" }), actor, T0);
  assert.throws(() => setPublished(db, post.id, true, actor), (e) => e instanceof PostError && e.code === "empty");
  assert.throws(() => createPost(db, input({ title: "  " }), actor), (e) => e.code === "title");
  assert.throws(() => createPost(db, input({ title: "a".repeat(POSTS_POLICY.titleMax + 1) }), actor), (e) => e.code === "title");
  assert.throws(() => createPost(db, input({ summary: "a".repeat(POSTS_POLICY.summaryMax + 1) }), actor), (e) => e.code === "summary");
  assert.throws(() => createPost(db, input({ body: "a".repeat(POSTS_POLICY.bodyMax + 1) }), actor), (e) => e.code === "body");
});

test("bài có ảnh chỉ đăng được khi xác nhận phụ huynh đồng ý, và nhật ký ghi lại xác nhận đó", () => {
  const db = openDb(":memory:");
  const post = createPost(db, input(), actor, T0);
  addImage(db, post.id, "a.webp", "", actor, T0);
  assert.throws(() => setPublished(db, post.id, true, actor, T0 + 1), (e) => e.code === "consent");
  assert.equal(getPublishedBySlug(db, post.slug), null);
  setPublished(db, post.id, true, actor, T0 + 2, true);
  assert.ok(getPublishedBySlug(db, post.slug));
  const entry = listAudit(db, 10).find((a) => a.action === "post_published");
  assert.equal(entry.detail.photoConsent, true);
  // Gỡ bài không cần xác nhận.
  setPublished(db, post.id, false, actor, T0 + 3);
});

test("danh sách công khai: mới nhất trước, có phân trang", () => {
  const db = openDb(":memory:");
  for (let i = 1; i <= 3; i++) {
    const p = createPost(db, input({ title: `Bài ${i}` }), actor, T0 + i);
    setPublished(db, p.id, true, actor, T0 + i * 100);
  }
  assert.deepEqual(listPublished(db, 1, 2).map((p) => p.title), ["Bài 3", "Bài 2"]);
  assert.deepEqual(listPublished(db, 2, 2).map((p) => p.title), ["Bài 1"]);
});

test("ảnh: thêm, ảnh đầu là bìa, đổi bìa, gỡ, giới hạn số ảnh, xoá bài trả về file cần xoá", () => {
  const db = openDb(":memory:");
  const post = createPost(db, input(), actor, T0);
  for (let i = 0; i < POSTS_POLICY.maxImages; i++) addImage(db, post.id, `f${i}.webp`, ` chú  thích ${i} `, actor, T0);
  assert.throws(() => addImage(db, post.id, "x.webp", "", actor), (e) => e.code === "too_many_images");
  let images = listImages(db, post.id);
  assert.equal(images[0].file, "f0.webp");
  assert.equal(images[0].caption, "chú thích 0");
  setCover(db, post.id, images[3].id, actor);
  images = listImages(db, post.id);
  assert.equal(images[0].file, "f3.webp");
  assert.equal(removeImage(db, post.id, images[0].id, actor), "f3.webp");
  assert.equal(removeImage(db, post.id, 99999, actor), null);
  assert.equal(listImages(db, post.id)[0].file, "f0.webp");
  assert.equal(deletePost(db, post.id, actor).length, POSTS_POLICY.maxImages - 1);
  assert.equal(listImages(db, post.id).length, 0);
});

test("mỗi thay đổi đều có trong nhật ký", () => {
  const db = openDb(":memory:");
  const p = createPost(db, input(), actor, T0);
  setPublished(db, p.id, true, actor, T0 + 1);
  const actions = listAudit(db, 50).map((a) => a.action);
  for (const a of ["post_created", "post_published"]) assert.ok(actions.includes(a), a);
});

test("parseBody: dòng trống tách đoạn, '## ' là tiêu đề mục, HTML không có ý nghĩa gì", () => {
  assert.deepEqual(parseBody("Đoạn một\ndòng hai\n\n## Mục\n\nĐoạn <b>ba</b>"), [
    { kind: "p", text: "Đoạn một dòng hai" },
    { kind: "h2", text: "Mục" },
    { kind: "p", text: "Đoạn <b>ba</b>" },
  ]);
  assert.deepEqual(parseBody(""), []);
  assert.deepEqual(parseBody("##không có dấu cách"), [{ kind: "p", text: "##không có dấu cách" }]);
});

test("ảnh tải lên: thu nhỏ, đổi webp, xoá EXIF; từ chối file không phải ảnh hoặc quá lớn", async () => {
  const big = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#c33" } })
    .jpeg().withExif({ IFD0: { Copyright: "bí mật" } }).toBuffer();
  const out = await processImage(big);
  const meta = await sharp(out).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, POSTS_POLICY.imageMaxWidth);
  assert.equal(meta.exif, undefined);
  const small = await sharp({ create: { width: 400, height: 300, channels: 3, background: "#369" } }).png().toBuffer();
  assert.equal((await sharp(await processImage(small)).metadata()).width, 400);
  await assert.rejects(processImage(Buffer.from("không phải ảnh")), UploadError);
  await assert.rejects(processImage(new Uint8Array(0)), UploadError);
  await assert.rejects(processImage(new Uint8Array(POSTS_POLICY.maxUploadBytes + 1)), UploadError);
  assert.ok(isUploadName("a".repeat(32) + ".webp"));
  assert.ok(!isUploadName("../etc/passwd"));
});

test("giới hạn tốc độ: vượt hạn mức thì từ chối, theo từng IP, và hết cửa sổ thì được lại", () => {
  const limiter = new RateLimiter(2, 1000);
  assert.ok(limiter.take("a", 0));
  assert.ok(limiter.take("a", 10));
  assert.ok(!limiter.take("a", 20));
  assert.ok(limiter.take("b", 20));
  assert.ok(!limiter.take("a", 999));
  assert.ok(limiter.take("a", 1011));
});
