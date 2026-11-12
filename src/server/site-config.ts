// src/server/site-config.ts
// Điểm vào duy nhất để trang công khai đọc cấu hình bật/tắt (đọc DB mỗi request, lỗi thì dùng mặc định).
import { getDb } from "./db";
import { loadSiteConfig, type SiteConfig } from "./flags";
import { countPublished, listImages, listPublished } from "./posts";
import { listEnabledSlides, type Slide } from "./slides";

export function getSiteConfig(): SiteConfig {
  return loadSiteConfig(getDb);
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

/** Mục nào đã có bài đăng: quyết định menu, ô lối tắt và khối tin hiện gì. Lỗi DB thì coi như chưa có. */
export function getNewsAvailability(): { news: boolean; knowledge: boolean } {
  try {
    const db = getDb();
    return { news: countPublished(db, "news") > 0, knowledge: countPublished(db, "knowledge") > 0 };
  } catch {
    return { news: false, knowledge: false };
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
