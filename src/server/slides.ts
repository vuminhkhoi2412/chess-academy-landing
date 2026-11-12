// src/server/slides.ts
//
// Slide của banner trang chủ: ảnh, chữ tiêu đề, chữ phụ, liên kết, thứ tự, bật/tắt.
// Mọi thay đổi ghi vào nhật ký. Ảnh đã được xử lý ở uploads.ts; ở đây chỉ nhận tên file.

import { audit, type Actor } from "./auth.ts";
import type { Db } from "./db.ts";
import { SLIDES_POLICY } from "./policy.ts";

export class SlideError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export interface Slide {
  id: number;
  file: string;
  title: string;
  text: string;
  link: string;
  alt: string;
  position: number;
  enabled: boolean;
  updatedAt: number;
  updatedBy: string | null;
}

export interface SlideInput {
  title: string;
  text: string;
  link: string;
  alt: string;
}

type Row = Record<string, unknown>;

const toSlide = (r: Row): Slide => ({
  id: r.id as number,
  file: r.file as string,
  title: r.title as string,
  text: r.text as string,
  link: r.link as string,
  alt: r.alt as string,
  position: r.position as number,
  enabled: r.enabled === 1,
  updatedAt: r.updated_at as number,
  updatedBy: (r.updated_by as string | null) ?? null,
});

const squash = (text: string) => text.replace(/\s+/g, " ").trim();

/** Liên kết rỗng, đường dẫn trong site ("/news") hoặc địa chỉ https. Chặn "//", "javascript:", "http:". */
export function isSafeLink(link: string): boolean {
  return link === "" || (/^\/(?!\/)\S*$/.test(link) && link.length <= SLIDES_POLICY.linkMax) || (/^https:\/\/\S+$/.test(link) && link.length <= SLIDES_POLICY.linkMax);
}

function clean(input: SlideInput): SlideInput {
  const v = { title: squash(input.title), text: squash(input.text), link: input.link.trim(), alt: squash(input.alt) };
  if (v.title.length > SLIDES_POLICY.titleMax)
    throw new SlideError("title", `Tiêu đề tối đa ${SLIDES_POLICY.titleMax} ký tự (hiện ${v.title.length}).`);
  if (v.text.length > SLIDES_POLICY.textMax)
    throw new SlideError("text", `Dòng chữ phụ tối đa ${SLIDES_POLICY.textMax} ký tự (hiện ${v.text.length}).`);
  if (v.alt.length > SLIDES_POLICY.altMax)
    throw new SlideError("alt", `Mô tả ảnh tối đa ${SLIDES_POLICY.altMax} ký tự (hiện ${v.alt.length}).`);
  if (v.title === "" && v.alt === "")
    throw new SlideError("alt", "Slide không có tiêu đề thì cần mô tả ảnh, để người dùng đọc màn hình biết ảnh nói gì.");
  if (!isSafeLink(v.link))
    throw new SlideError("link", 'Liên kết phải bắt đầu bằng "/" (trang trong site, ví dụ /news) hoặc "https://".');
  return v;
}

export function listSlides(db: Db): Slide[] {
  return (db.prepare("SELECT * FROM slides ORDER BY position, id").all() as Row[]).map(toSlide);
}

/** Slide đang bật, theo thứ tự hiển thị. */
export function listEnabledSlides(db: Db): Slide[] {
  return (db.prepare("SELECT * FROM slides WHERE enabled = 1 ORDER BY position, id").all() as Row[]).map(toSlide);
}

export function getSlide(db: Db, id: number): Slide | null {
  const r = db.prepare("SELECT * FROM slides WHERE id = ?").get(id) as Row | undefined;
  return r ? toSlide(r) : null;
}

export function createSlide(db: Db, file: string, input: SlideInput, actor: Actor, now: number = Date.now()): Slide {
  const v = clean(input);
  const all = listSlides(db);
  if (all.length >= SLIDES_POLICY.maxSlides)
    throw new SlideError("too_many", `Tối đa ${SLIDES_POLICY.maxSlides} slide. Hãy xoá bớt một slide cũ trước.`);
  const position = all.length === 0 ? 0 : all[all.length - 1].position + 1;
  const info = db
    .prepare(
      "INSERT INTO slides (file, title, text, link, alt, position, enabled, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)",
    )
    .run(file, v.title, v.text, v.link, v.alt, position, now, actor.username);
  const id = Number(info.lastInsertRowid);
  audit(db, actor, "slide_created", String(id), { title: v.title }, now);
  return getSlide(db, id)!;
}

export function updateSlide(db: Db, id: number, input: SlideInput, actor: Actor, now: number = Date.now()): Slide {
  const v = clean(input);
  if (!getSlide(db, id)) throw new SlideError("not_found", "Slide không tồn tại.");
  db.prepare("UPDATE slides SET title=?, text=?, link=?, alt=?, updated_at=?, updated_by=? WHERE id=?").run(
    v.title, v.text, v.link, v.alt, now, actor.username, id,
  );
  audit(db, actor, "slide_updated", String(id), { title: v.title }, now);
  return getSlide(db, id)!;
}

export function setSlideEnabled(db: Db, id: number, enabled: boolean, actor: Actor, now: number = Date.now()): void {
  const slide = getSlide(db, id);
  if (!slide) throw new SlideError("not_found", "Slide không tồn tại.");
  db.prepare("UPDATE slides SET enabled=?, updated_at=?, updated_by=? WHERE id=?").run(enabled ? 1 : 0, now, actor.username, id);
  audit(db, actor, enabled ? "slide_enabled" : "slide_disabled", String(id), { title: slide.title }, now);
}

/** Đổi chỗ với slide liền trước (-1) hoặc liền sau (+1). Ở đầu/cuối danh sách thì không làm gì. */
export function moveSlide(db: Db, id: number, direction: -1 | 1, actor: Actor, now: number = Date.now()): void {
  const all = listSlides(db);
  const index = all.findIndex((slide) => slide.id === id);
  if (index === -1) throw new SlideError("not_found", "Slide không tồn tại.");
  const other = all[index + direction];
  if (!other) return;
  // Gán lại vị trí liên tục 0..n-1 để thứ tự không bao giờ trùng.
  const order = all.map((slide) => slide.id);
  [order[index], order[index + direction]] = [order[index + direction], order[index]];
  order.forEach((slideId, position) => db.prepare("UPDATE slides SET position = ? WHERE id = ?").run(position, slideId));
  db.prepare("UPDATE slides SET updated_at=?, updated_by=? WHERE id=?").run(now, actor.username, id);
  audit(db, actor, "slide_moved", String(id), { direction: direction < 0 ? "lên" : "xuống" }, now);
}

/** Trả về tên file ảnh đã gỡ khỏi DB để nơi gọi xoá file thật. */
export function deleteSlide(db: Db, id: number, actor: Actor, now: number = Date.now()): string {
  const slide = getSlide(db, id);
  if (!slide) throw new SlideError("not_found", "Slide không tồn tại.");
  db.prepare("DELETE FROM slides WHERE id = ?").run(id);
  audit(db, actor, "slide_deleted", String(id), { title: slide.title }, now);
  return slide.file;
}
