// src/server/posts.ts
//
// Bài đăng: nháp/đã đăng, ảnh đính kèm, và tách nội dung thành đoạn/tiêu đề mục để trang vẽ ra.
// Nội dung là văn bản thuần (dòng trống = đoạn mới, dòng bắt đầu bằng "## " = tiêu đề mục),
// không có HTML: nhân viên không thể làm hỏng trang, và không có chỗ cho mã độc.

import { audit, type Actor } from "./auth.ts";
import type { Db } from "./db.ts";
import { POSTS_POLICY } from "./policy.ts";
import { htmlToText, sanitizeBody } from "./rich-text.ts";

export class PostError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  summary: string;
  /** HTML đã lọc nếu bodyFormat là "html"; văn bản thuần nếu là "text" (bài cũ). Hiển thị bằng `bodyHtml`. */
  body: string;
  bodyFormat: "text" | "html";
  status: "draft" | "published";
  publishedAt: number | null;
  createdAt: number;
  createdBy: string | null;
  updatedAt: number;
  updatedBy: string | null;
}

export interface PostImage {
  id: number;
  postId: number;
  file: string;
  caption: string;
  position: number;
}

export interface PostInput {
  title: string;
  summary: string;
  body: string;
}

type Row = Record<string, unknown>;

function toPost(r: Row): Post {
  return {
    id: r.id as number,
    slug: r.slug as string,
    title: r.title as string,
    summary: r.summary as string,
    body: r.body as string,
    bodyFormat: (r.body_format as "text" | "html") ?? "text",
    status: r.status as Post["status"],
    publishedAt: (r.published_at as number | null) ?? null,
    createdAt: r.created_at as number,
    createdBy: (r.created_by as string | null) ?? null,
    updatedAt: r.updated_at as number,
    updatedBy: (r.updated_by as string | null) ?? null,
  };
}

/** "Giải cờ vua mùa hè 2026!" → "giai-co-vua-mua-he-2026". */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "bai-viet";
}

function uniqueSlug(db: Db, title: string): string {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; db.prepare("SELECT 1 FROM posts WHERE slug = ?").get(slug); n++) slug = `${base}-${n}`;
  return slug;
}

function clean(input: PostInput): PostInput {
  const title = input.title.replace(/\s+/g, " ").trim();
  const summary = input.summary.replace(/\s+/g, " ").trim();
  // Nội dung luôn là HTML từ trình soạn thảo, đã lọc: chỉ giữ thẻ/thuộc tính cho phép.
  const body = sanitizeBody(input.body.replace(/\r\n?/g, "\n"));
  if (title === "") throw new PostError("title", "Hãy nhập tiêu đề bài viết.");
  if (title.length > POSTS_POLICY.titleMax)
    throw new PostError("title", `Tiêu đề tối đa ${POSTS_POLICY.titleMax} ký tự (hiện ${title.length}).`);
  if (summary.length > POSTS_POLICY.summaryMax)
    throw new PostError("summary", `Tóm tắt tối đa ${POSTS_POLICY.summaryMax} ký tự (hiện ${summary.length}).`);
  const textLength = htmlToText(body).length;
  if (textLength > POSTS_POLICY.bodyMax)
    throw new PostError("body", `Nội dung tối đa ${POSTS_POLICY.bodyMax} ký tự (hiện ${textLength}).`);
  if (body.length > POSTS_POLICY.bodyHtmlMax) throw new PostError("body", "Nội dung quá dài.");
  return { title, summary, body };
}

export function createPost(db: Db, input: PostInput, actor: Actor, now: number = Date.now()): Post {
  const v = clean(input);
  const slug = uniqueSlug(db, v.title);
  const info = db
    .prepare(
      `INSERT INTO posts (slug, title, summary, body, body_format, status, created_at, created_by, updated_at, updated_by)
       VALUES (?, ?, ?, ?, 'html', 'draft', ?, ?, ?, ?)`,
    )
    .run(slug, v.title, v.summary, v.body, now, actor.username, now, actor.username);
  const id = Number(info.lastInsertRowid);
  audit(db, actor, "post_created", String(id), { title: v.title }, now);
  return getPostById(db, id)!;
}

/** Đường dẫn (slug) giữ nguyên khi sửa tiêu đề, để link đã chia sẻ không chết. */
export function updatePost(db: Db, id: number, input: PostInput, actor: Actor, now: number = Date.now()): Post {
  const v = clean(input);
  if (!getPostById(db, id)) throw new PostError("not_found", "Bài viết không tồn tại.");
  db.prepare("UPDATE posts SET title=?, summary=?, body=?, body_format='html', updated_at=?, updated_by=? WHERE id=?").run(
    v.title,
    v.summary,
    v.body,
    now,
    actor.username,
    id,
  );
  audit(db, actor, "post_updated", String(id), { title: v.title }, now);
  return getPostById(db, id)!;
}

/**
 * Đăng bài cần có nội dung; bài có ảnh còn cần người đăng xác nhận đã được phụ huynh đồng ý cho đăng ảnh
 * các bé (`photoConsent`). Giờ đăng giữ nguyên nếu đã từng đăng.
 */
export function setPublished(
  db: Db,
  id: number,
  published: boolean,
  actor: Actor,
  now: number = Date.now(),
  photoConsent = false,
): void {
  const post = getPostById(db, id);
  if (!post) throw new PostError("not_found", "Bài viết không tồn tại.");
  if (published && bodyText(post) === "") throw new PostError("empty", "Bài viết chưa có nội dung nên chưa thể đăng.");
  const hasImages = listImages(db, id).length > 0;
  if (published && hasImages && !photoConsent)
    throw new PostError("consent", "Hãy tích xác nhận đã được phụ huynh đồng ý cho đăng ảnh các bé trước khi đăng.");
  db.prepare(
    "UPDATE posts SET status=?, published_at=COALESCE(published_at, ?), updated_at=?, updated_by=? WHERE id=?",
  ).run(published ? "published" : "draft", published ? now : null, now, actor.username, id);
  audit(db, actor, published ? "post_published" : "post_unpublished", String(id), {
    title: post.title,
    ...(published && hasImages ? { photoConsent: true } : {}),
  }, now);
}

/** Trả về danh sách file ảnh đã gỡ khỏi DB để nơi gọi xoá file thật. */
export function deletePost(db: Db, id: number, actor: Actor, now: number = Date.now()): string[] {
  const post = getPostById(db, id);
  if (!post) throw new PostError("not_found", "Bài viết không tồn tại.");
  const files = listImages(db, id).map((image) => image.file);
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  audit(db, actor, "post_deleted", String(id), { title: post.title }, now);
  return files;
}

export function getPostById(db: Db, id: number): Post | null {
  const r = db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as Row | undefined;
  return r ? toPost(r) : null;
}

/** Chỉ bài đã đăng; nháp trả về null để địa chỉ công khai không lộ bài chưa xong. */
export function getPublishedBySlug(db: Db, slug: string): Post | null {
  const r = db.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'").get(slug) as Row | undefined;
  return r ? toPost(r) : null;
}

export function listPosts(db: Db): Post[] {
  return (db.prepare("SELECT * FROM posts ORDER BY updated_at DESC, id DESC").all() as Row[]).map(toPost);
}

export function listPublished(db: Db, page = 1, perPage = POSTS_POLICY.perPage): Post[] {
  const offset = (Math.max(1, page) - 1) * perPage;
  return (
    db
      .prepare("SELECT * FROM posts WHERE status='published' ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?")
      .all(perPage, offset) as Row[]
  ).map(toPost);
}

export function countPublished(db: Db): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM posts WHERE status='published'").get() as { n: number }).n;
}

// ---------- Ảnh ----------

function toImage(r: Row): PostImage {
  return {
    id: r.id as number,
    postId: r.post_id as number,
    file: r.file as string,
    caption: r.caption as string,
    position: r.position as number,
  };
}

export function listImages(db: Db, postId: number): PostImage[] {
  return (
    db.prepare("SELECT * FROM post_images WHERE post_id = ? ORDER BY position, id").all(postId) as Row[]
  ).map(toImage);
}

export function addImage(db: Db, postId: number, file: string, caption: string, actor: Actor, now: number = Date.now()): void {
  if (!getPostById(db, postId)) throw new PostError("not_found", "Bài viết không tồn tại.");
  const existing = listImages(db, postId);
  if (existing.length >= POSTS_POLICY.maxImages)
    throw new PostError("too_many_images", `Mỗi bài tối đa ${POSTS_POLICY.maxImages} ảnh.`);
  const text = caption.replace(/\s+/g, " ").trim().slice(0, POSTS_POLICY.captionMax);
  const position = existing.length === 0 ? 0 : existing[existing.length - 1].position + 1;
  db.prepare("INSERT INTO post_images (post_id, file, caption, position) VALUES (?, ?, ?, ?)").run(postId, file, text, position);
  db.prepare("UPDATE posts SET updated_at=?, updated_by=? WHERE id=?").run(now, actor.username, postId);
  audit(db, actor, "post_image_added", String(postId), { file }, now);
}

/** Trả về tên file đã gỡ (hoặc null nếu không có) để nơi gọi xoá file thật. */
export function removeImage(db: Db, postId: number, imageId: number, actor: Actor, now: number = Date.now()): string | null {
  const r = db.prepare("SELECT * FROM post_images WHERE id = ? AND post_id = ?").get(imageId, postId) as Row | undefined;
  if (!r) return null;
  const image = toImage(r);
  db.prepare("DELETE FROM post_images WHERE id = ?").run(imageId);
  db.prepare("UPDATE posts SET updated_at=?, updated_by=? WHERE id=?").run(now, actor.username, postId);
  audit(db, actor, "post_image_removed", String(postId), { file: image.file }, now);
  return image.file;
}

/** Đưa ảnh lên làm ảnh bìa (vị trí đầu). */
export function setCover(db: Db, postId: number, imageId: number, actor: Actor, now: number = Date.now()): void {
  const images = listImages(db, postId);
  const chosen = images.find((image) => image.id === imageId);
  if (!chosen) throw new PostError("not_found", "Ảnh không thuộc bài viết này.");
  const ordered = [chosen, ...images.filter((image) => image.id !== imageId)];
  ordered.forEach((image, index) => db.prepare("UPDATE post_images SET position = ? WHERE id = ?").run(index, image.id));
  db.prepare("UPDATE posts SET updated_at=?, updated_by=? WHERE id=?").run(now, actor.username, postId);
  audit(db, actor, "post_cover_set", String(postId), { image: imageId }, now);
}

// ---------- Hiển thị ----------

export type Block = { kind: "h2"; text: string } | { kind: "p"; text: string };

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Tách văn bản thuần (bài cũ) thành các khối: dòng trống = đoạn mới, "## " đầu dòng = tiêu đề mục. */
export function parseBody(body: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of body.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter((line) => line !== "");
    if (lines.length === 0) continue;
    let paragraph: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    for (const line of lines) {
      if (line.startsWith("## ") && line.slice(3).trim() !== "") {
        flush();
        blocks.push({ kind: "h2", text: line.slice(3).trim() });
      } else paragraph.push(line);
    }
    flush();
  }
  return blocks;
}

/**
 * HTML an toàn để hiển thị hoặc nạp vào trình soạn thảo. Bài cũ (văn bản thuần) được đổi sang HTML
 * với mọi ký tự được thoát; bài HTML được lọc lại một lần nữa phòng khi dữ liệu bị sửa ngoài ứng dụng.
 */
export function bodyHtml(post: Pick<Post, "body" | "bodyFormat">): string {
  if (post.bodyFormat === "html") return sanitizeBody(post.body);
  return parseBody(post.body)
    .map((block) => (block.kind === "h2" ? `<h2>${escapeHtml(block.text)}</h2>` : `<p>${escapeHtml(block.text)}</p>`))
    .join("");
}

/** Chữ thuần của bài, dùng làm tóm tắt dự phòng và kiểm tra bài rỗng. */
export function bodyText(post: Pick<Post, "body" | "bodyFormat">): string {
  return htmlToText(bodyHtml(post));
}
