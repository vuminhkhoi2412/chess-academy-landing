// src/server/categories.ts
//
// Mục của bài đăng (Tin tức, Kiến thức, Giải đấu & Sự kiện...). Quản trị thêm, đổi tên, đổi thứ tự, xoá.
// `slug` sinh từ tên lúc tạo rồi giữ nguyên khi đổi tên, để địa chỉ /news?category=... đã chia sẻ không chết.

import { audit, type Actor } from "./auth.ts";
import type { Db } from "./db.ts";
import { CATEGORIES_POLICY } from "./policy.ts";
import { slugify } from "./posts.ts";

export class CategoryError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  position: number;
}

export interface CategoryWithCount extends Category {
  /** Số bài đã đăng. */
  published: number;
  /** Số bài kể cả nháp; xoá mục chỉ được khi bằng 0. */
  total: number;
}

type Row = Record<string, unknown>;

const toCategory = (r: Row): Category => ({
  id: r.id as number,
  slug: r.slug as string,
  name: r.name as string,
  position: r.position as number,
});

export function listCategories(db: Db): Category[] {
  return (db.prepare("SELECT * FROM categories ORDER BY position, id").all() as Row[]).map(toCategory);
}

export function getCategory(db: Db, id: number): Category | null {
  const r = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Row | undefined;
  return r ? toCategory(r) : null;
}

export function getCategoryBySlug(db: Db, slug: string): Category | null {
  const r = db.prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as Row | undefined;
  return r ? toCategory(r) : null;
}

/** Mọi mục kèm số bài, theo thứ tự hiển thị. */
export function listCategoriesWithCounts(db: Db): CategoryWithCount[] {
  const rows = db
    .prepare(
      `SELECT c.*,
              COUNT(p.id) AS total,
              COALESCE(SUM(p.status = 'published'), 0) AS published
         FROM categories c LEFT JOIN posts p ON p.category_id = c.id
        GROUP BY c.id ORDER BY c.position, c.id`,
    )
    .all() as Row[];
  return rows.map((r) => ({ ...toCategory(r), published: r.published as number, total: r.total as number }));
}

/** Các mục đã có bài đăng, theo thứ tự hiển thị: quyết định menu, thanh lọc và khối tin hiện gì. */
export const listPublishedCategories = (db: Db): CategoryWithCount[] =>
  listCategoriesWithCounts(db).filter((category) => category.published > 0);

function cleanName(raw: string): string {
  const name = raw.replace(/\s+/g, " ").trim();
  if (name === "") throw new CategoryError("name", "Hãy nhập tên mục.");
  if (name.length > CATEGORIES_POLICY.nameMax)
    throw new CategoryError("name", `Tên mục tối đa ${CATEGORIES_POLICY.nameMax} ký tự (hiện ${name.length}).`);
  return name;
}

function sameName(db: Db, name: string, exceptId = 0): boolean {
  return listCategories(db).some((c) => c.id !== exceptId && c.name.toLowerCase() === name.toLowerCase());
}

export function createCategory(db: Db, rawName: string, actor: Actor, now: number = Date.now()): Category {
  const name = cleanName(rawName);
  if (listCategories(db).length >= CATEGORIES_POLICY.maxCategories)
    throw new CategoryError("too_many", `Tối đa ${CATEGORIES_POLICY.maxCategories} mục. Hãy xoá hoặc gộp bớt một mục.`);
  if (sameName(db, name)) throw new CategoryError("duplicate", "Đã có mục trùng tên này.");
  const base = slugify(name);
  let slug = base;
  for (let n = 2; getCategoryBySlug(db, slug); n++) slug = `${base}-${n}`;
  const position = (db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM categories").get() as { n: number }).n;
  const info = db.prepare("INSERT INTO categories (slug, name, position) VALUES (?, ?, ?)").run(slug, name, position);
  const id = Number(info.lastInsertRowid);
  audit(db, actor, "category_created", String(id), { name }, now);
  return getCategory(db, id)!;
}

export function renameCategory(db: Db, id: number, rawName: string, actor: Actor, now: number = Date.now()): Category {
  const before = getCategory(db, id);
  if (!before) throw new CategoryError("not_found", "Mục không tồn tại.");
  const name = cleanName(rawName);
  if (sameName(db, name, id)) throw new CategoryError("duplicate", "Đã có mục trùng tên này.");
  db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(name, id);
  audit(db, actor, "category_renamed", String(id), { from: before.name, to: name }, now);
  return getCategory(db, id)!;
}

/** Đổi chỗ với mục liền trước (-1) hoặc liền sau (+1). Ở đầu/cuối danh sách thì không làm gì. */
export function moveCategory(db: Db, id: number, direction: -1 | 1, actor: Actor, now: number = Date.now()): void {
  const all = listCategories(db);
  const index = all.findIndex((category) => category.id === id);
  if (index === -1) throw new CategoryError("not_found", "Mục không tồn tại.");
  if (!all[index + direction]) return;
  const order = all.map((category) => category.id);
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  order.forEach((categoryId, position) => db.prepare("UPDATE categories SET position = ? WHERE id = ?").run(position, categoryId));
  audit(db, actor, "category_moved", String(id), { name: all[index].name, direction: direction < 0 ? "lên" : "xuống" }, now);
}

/** Chỉ xoá được mục không còn bài nào (kể cả nháp): không để bài mất mục. Mục cuối cùng cũng không xoá được. */
export function deleteCategory(db: Db, id: number, actor: Actor, now: number = Date.now()): void {
  const category = listCategoriesWithCounts(db).find((c) => c.id === id);
  if (!category) throw new CategoryError("not_found", "Mục không tồn tại.");
  if (category.total > 0)
    throw new CategoryError("in_use", `Mục "${category.name}" còn ${category.total} bài. Hãy chuyển các bài sang mục khác trước khi xoá.`);
  if (listCategories(db).length <= 1) throw new CategoryError("last", "Phải còn ít nhất một mục.");
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  audit(db, actor, "category_deleted", String(id), { name: category.name }, now);
}
