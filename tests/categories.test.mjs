// tests/categories.test.mjs
// Chạy: npm test
// Khóa hành vi mục bài đăng: mục có sẵn, thêm/đổi tên/đổi thứ tự/xoá, và bài cũ được chuyển đúng mục khi nâng cấp DB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, migrate, openDb } from "../src/server/db.ts";
import { listAudit } from "../src/server/auth.ts";
import { CATEGORIES_POLICY } from "../src/server/policy.ts";
import {
  CategoryError, createCategory, deleteCategory, getCategoryBySlug, listCategories, listCategoriesWithCounts,
  listPublishedCategories, moveCategory, renameCategory,
} from "../src/server/categories.ts";
import { createPost, getPostById, listPublished, setPublished, updatePost } from "../src/server/posts.ts";

const actor = { id: 1, username: "admin" };
const T0 = 1_800_000_000_000;
const base = { summary: "", body: "Nội dung" };
const code = (fn) => (e) => e instanceof CategoryError && e.code === fn;

test("DB mới có năm mục theo thứ tự, mã cũ news/knowledge được giữ", () => {
  const db = openDb(":memory:");
  assert.deepEqual(listCategories(db).map((c) => c.slug), ["news", "knowledge", "events", "stories", "parents"]);
  assert.equal(getCategoryBySlug(db, "news").name, "Tin tức");
});

test("nâng cấp DB cũ: bài 'knowledge' và 'news' được gắn đúng mục mới", () => {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  const upTo = MIGRATIONS.length - 1; // dừng trước bước tạo bảng categories
  for (let i = 0; i < upTo; i++) db.exec(MIGRATIONS[i]);
  db.exec(`PRAGMA user_version = ${upTo}`);
  const ins = db.prepare("INSERT INTO posts (slug,title,summary,body,status,category,created_at,updated_at) VALUES (?,?,?,?,?,?,1,1)");
  ins.run("a", "A", "", "x", "published", "news");
  ins.run("b", "B", "", "x", "published", "knowledge");
  migrate(db);
  assert.equal(getPostById(db, 1).category, "news");
  assert.equal(getPostById(db, 2).category, "knowledge");
  assert.equal(getPostById(db, 2).categoryName, "Kiến thức");
});

test("thêm mục: slug sinh từ tên, trùng tên bị chặn, tên rỗng hoặc quá dài bị chặn", () => {
  const db = openDb(":memory:");
  const made = createCategory(db, "  Cờ vua   nâng cao ", actor, T0);
  assert.equal(made.name, "Cờ vua nâng cao");
  assert.equal(made.slug, "co-vua-nang-cao");
  assert.equal(made.position, 5);
  assert.throws(() => createCategory(db, "cờ vua NÂNG CAO", actor), code("duplicate"));
  assert.throws(() => createCategory(db, "   ", actor), code("name"));
  assert.throws(() => createCategory(db, "x".repeat(CATEGORIES_POLICY.nameMax + 1), actor), code("name"));
  // Hai tên khác nhau cho cùng slug thì slug được thêm số, không đè lên nhau.
  assert.equal(createCategory(db, "Cờ-vua nâng cao!", actor).slug, "co-vua-nang-cao-2");
});

test("quá số mục tối đa thì không thêm được", () => {
  const db = openDb(":memory:");
  for (let n = listCategories(db).length; n < CATEGORIES_POLICY.maxCategories; n++) createCategory(db, `Mục ${n}`, actor);
  assert.throws(() => createCategory(db, "Mục thừa", actor), code("too_many"));
});

test("đổi tên giữ nguyên slug để liên kết cũ còn dùng được", () => {
  const db = openDb(":memory:");
  const knowledge = getCategoryBySlug(db, "knowledge");
  renameCategory(db, knowledge.id, "Góc học tập", actor, T0);
  assert.equal(getCategoryBySlug(db, "knowledge").name, "Góc học tập");
  const post = createPost(db, { ...base, title: "Bài A", category: "knowledge" }, actor, T0);
  assert.equal(getPostById(db, post.id).categoryName, "Góc học tập");
  assert.throws(() => renameCategory(db, knowledge.id, "Tin tức", actor), code("duplicate"));
  assert.throws(() => renameCategory(db, 999, "X", actor), code("not_found"));
  assert.equal(renameCategory(db, knowledge.id, "Góc học tập", actor).name, "Góc học tập", "giữ tên cũ không bị coi là trùng");
});

test("đổi thứ tự: đổi chỗ với mục kề, đầu/cuối danh sách thì không làm gì", () => {
  const db = openDb(":memory:");
  const slugs = () => listCategories(db).map((c) => c.slug);
  const [news, knowledge] = listCategories(db);
  moveCategory(db, knowledge.id, -1, actor, T0);
  assert.deepEqual(slugs().slice(0, 2), ["knowledge", "news"]);
  moveCategory(db, knowledge.id, -1, actor, T0); // đã ở đầu
  assert.deepEqual(slugs().slice(0, 2), ["knowledge", "news"]);
  moveCategory(db, news.id, 1, actor, T0);
  assert.deepEqual(slugs().slice(0, 3), ["knowledge", "events", "news"]);
  assert.deepEqual(listCategories(db).map((c) => c.position), [0, 1, 2, 3, 4]);
});

test("xoá mục: bị chặn khi còn bài (kể cả nháp) và khi là mục cuối; mục trống thì xoá được", () => {
  const db = openDb(":memory:");
  const events = getCategoryBySlug(db, "events");
  const draft = createPost(db, { ...base, title: "Giải hè", category: "events" }, actor, T0);
  assert.throws(() => deleteCategory(db, events.id, actor), code("in_use"));
  updatePost(db, draft.id, { ...base, title: "Giải hè", category: "news" }, actor, T0 + 1);
  deleteCategory(db, events.id, actor, T0 + 2);
  assert.equal(getCategoryBySlug(db, "events"), null);
  assert.throws(() => deleteCategory(db, events.id, actor), code("not_found"));
  const only = openDb(":memory:");
  for (const c of listCategories(only).slice(1)) deleteCategory(only, c.id, actor);
  assert.throws(() => deleteCategory(only, listCategories(only)[0].id, actor), code("last"));
  const actions = listAudit(db, 10).map((r) => r.action);
  assert.ok(actions.includes("category_deleted"));
});

test("bài tham chiếu mục đã xoá bị chặn bởi khoá ngoại, mã mục lạ bị từ chối khi lưu bài", () => {
  const db = openDb(":memory:");
  assert.throws(() => createPost(db, { ...base, title: "X", category: "khong-co" }, actor), (e) => e.code === "category");
  const post = createPost(db, { ...base, title: "Y", category: "stories" }, actor, T0);
  assert.throws(() => db.prepare("DELETE FROM categories WHERE slug='stories'").run());
  // Không truyền mục khi sửa thì giữ mục hiện tại.
  assert.equal(updatePost(db, post.id, { ...base, title: "Y2" }, actor, T0 + 1).category, "stories");
});

test("mục đã có bài đăng: chỉ đếm bài đã đăng, theo thứ tự mục, và lọc bài theo mã mục", () => {
  const db = openDb(":memory:");
  const a = createPost(db, { ...base, title: "Giải A", category: "events" }, actor, T0);
  const b = createPost(db, { ...base, title: "Tin B" }, actor, T0);
  createPost(db, { ...base, title: "Nháp C", category: "knowledge" }, actor, T0);
  setPublished(db, a.id, true, actor, T0 + 1);
  setPublished(db, b.id, true, actor, T0 + 2);
  assert.deepEqual(listPublishedCategories(db).map((c) => [c.slug, c.published]), [["news", 1], ["events", 1]]);
  const withCounts = listCategoriesWithCounts(db).find((c) => c.slug === "knowledge");
  assert.deepEqual([withCounts.published, withCounts.total], [0, 1]);
  assert.deepEqual(listPublished(db, 1, 12, "events").map((p) => p.title), ["Giải A"]);
});
