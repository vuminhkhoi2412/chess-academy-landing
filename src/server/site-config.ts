// src/server/site-config.ts
// Điểm vào duy nhất để trang công khai đọc cấu hình bật/tắt (đọc DB mỗi request, lỗi thì dùng mặc định).
import { getDb } from "./db";
import { loadSiteConfig, type SiteConfig } from "./flags";
import { listPublishedCategories } from "./categories";
import type { Db } from "./db";
import { listImages, listPublished, type Post, type PostImage } from "./posts";
import { listEnabledSlides, type Slide } from "./slides";
import { loadTuition, type Tuition } from "./tuition";
import { EXTRA_FEES, TUITION_LEVELS } from "../data/courses";

export function getSiteConfig(): SiteConfig {
  return loadSiteConfig(getDb);
}

type NewsItems = { post: Post; cover: PostImage | null }[];

/** Bài mới nhất kèm ảnh bìa; `category` là mã mục, bỏ trống thì lấy từ mọi mục. */
function latest(db: Db, count: number, category?: string): NewsItems {
  return listPublished(db, 1, count, category).map((post) => ({ post, cover: listImages(db, post.id)[0] ?? null }));
}

/**
 * Khối tin trang chủ: một nhóm bài cho tab "Tất cả" và một nhóm cho mỗi mục đã có bài, theo thứ tự mục.
 * Lỗi DB thì coi như chưa có bài (trang chủ ẩn khối này).
 */
export function getHomeNews(count: number): { slug: string | null; name: string; items: NewsItems }[] {
  try {
    const db = getDb();
    const all = latest(db, count);
    if (all.length === 0) return [];
    return [
      { slug: null, name: "Tất cả", items: all },
      ...listPublishedCategories(db).map((c) => ({ slug: c.slug, name: c.name, items: latest(db, count, c.slug) })),
    ];
  } catch {
    return [];
  }
}

/** Các mục đã có bài đăng, theo thứ tự hiển thị: quyết định menu, thanh lọc và khối tin hiện gì. Lỗi DB thì coi như chưa có. */
export function getNewsCategories(): { slug: string; name: string }[] {
  try {
    return listPublishedCategories(getDb()).map(({ slug, name }) => ({ slug, name }));
  } catch {
    return [];
  }
}

/** Slide banner đang bật; rỗng (hoặc lỗi DB) thì trang chủ dùng slide tạm trong HomeBanner. */
export function getHomeSlides(): Slide[] {
  try {
    return listEnabledSlides(getDb());
  } catch {
    return [];
  }
}

/** Học phí và phụ phí hiện hành; lỗi DB thì dùng giá khởi tạo trong code, trang chủ vẫn hiện giá. */
export function getTuition(): Tuition {
  try {
    return loadTuition(getDb());
  } catch {
    return { levels: TUITION_LEVELS, extras: EXTRA_FEES };
  }
}
