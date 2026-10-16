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

  // Thông tin nhận chuyển khoản, khai trong `.env` local và trong Environment
  // Variables của Vercel. Không có giá trị mặc định nên thiếu biến là build đỗ
  // ngay, thay vì âm thầm tạo mã QR sai.
  env: {
    schema: {
      PUBLIC_ACB_BANK_ID: envField.string({
        context: 'client',
        access: 'public',
        default: 'ACB',
      }),
      PUBLIC_ACB_ACCOUNT_NO: envField.string({
        context: 'client',
        access: 'public',
      }),
      PUBLIC_ACB_ACCOUNT_NAME: envField.string({
        context: 'client',
        access: 'public',
      }),
      PUBLIC_ACB_TEMPLATE: envField.string({
        context: 'client',
        access: 'public',
        default: 'compact2',
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap()]
});
