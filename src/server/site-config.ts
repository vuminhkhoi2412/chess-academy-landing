// src/server/site-config.ts
// Điểm vào duy nhất để trang công khai đọc cấu hình bật/tắt (đọc DB mỗi request, lỗi thì dùng mặc định).
import { getDb } from "./db";
import { loadSiteConfig, type SiteConfig } from "./flags";
import { countPublished } from "./posts";

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
