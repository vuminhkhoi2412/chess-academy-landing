// src/server/site-config.ts
// Điểm vào duy nhất để trang công khai đọc cấu hình bật/tắt (đọc DB mỗi request, lỗi thì dùng mặc định).
import { getDb } from "./db";
import { loadSiteConfig, type SiteConfig } from "./flags";

export function getSiteConfig(): SiteConfig {
  return loadSiteConfig(getDb);
}
