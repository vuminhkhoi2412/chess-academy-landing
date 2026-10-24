// @ts-check
import { defineConfig, envField } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: đổi thành domain thật trước khi deploy.
  // `site` này dùng cho canonical, og:url và sitemap.xml — sửa một chỗ này là đủ.
  site: 'https://globalchess.vn',

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
