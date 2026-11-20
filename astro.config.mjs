// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // `site` này dùng cho canonical, og:url và sitemap.xml — sửa một chỗ này là đủ.
  site: 'https://globalchess.edu.vn',

  // Trang công khai vẫn build tĩnh. Chỉ các trang đặt `export const prerender = false`
  // (trang quản trị) chạy trên server Node, dữ liệu nằm trong SQLite ở thư mục DATA_DIR.
  adapter: node({ mode: 'standalone' }),

  // Địa chỉ cũ (tiếng Việt) của hai trang pháp lý: giữ link đã chia sẻ và chỉ mục tìm kiếm không chết.
  redirects: {
    '/chinh-sach-bao-mat': { status: 301, destination: '/privacy-policy' },
    '/dieu-khoan-su-dung': { status: 301, destination: '/terms' },
  },

  // Sau Caddy, Astro cần biết những tên miền nào được tin ở X-Forwarded-Host, nếu không kiểm tra
  // nguồn gốc (Origin) coi mọi form POST là giả mạo và trả 403. Đổi tên miền ở đây rồi build lại.
  // `localhost` (http) chỉ để chạy thử bằng docker compose trên máy; `**.` gồm cả subdomain thử nghiệm.
  security: {
    allowedDomains: [
      { protocol: 'https', hostname: 'globalchess.edu.vn' },
      { protocol: 'https', hostname: '**.globalchess.edu.vn' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // URL /exec của Google Apps Script nhận đăng ký, khai trong `.env` local và trong
  // Environment Variables của Vercel. Không có giá trị mặc định nên thiếu biến là build đỗ
  // ngay, thay vì deploy một form không gửi được đi đâu.
  env: {
    schema: {
      PUBLIC_GOOGLE_SHEETS_ENDPOINT: envField.string({
        context: 'client',
        access: 'public',
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap()]
});
