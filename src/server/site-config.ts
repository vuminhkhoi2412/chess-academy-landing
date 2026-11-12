// src/server/site-config.ts
// Điểm vào duy nhất để trang công khai đọc cấu hình bật/tắt (đọc DB mỗi request, lỗi thì dùng mặc định).
import { getDb } from "./db";
import { loadSiteConfig, type SiteConfig } from "./flags";
import { countPublished, listImages, listPublished } from "./posts";

export function getSiteConfig(): SiteConfig {
  return loadSiteConfig(getDb);
}

/** Trang chủ chỉ hiện mục "Tin tức" khi có bài đã đăng; lỗi DB thì coi như chưa có. */
export function hasPublishedPosts(): boolean {
  try {
    return countPublished(getDb()) > 0;
  } catch {
    return false;
  }
}

/** Bài mới nhất cho khối tin trên trang chủ, kèm ảnh bìa; lỗi DB thì coi như chưa có bài. */
export function getLatestPosts(count: number) {
  try {
    const db = getDb();
    return listPublished(db, 1, count).map((post) => ({ post, cover: listImages(db, post.id)[0] ?? null }));
  } catch {
    return [];
  }
}
