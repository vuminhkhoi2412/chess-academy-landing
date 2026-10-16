// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // TODO: đổi thành domain thật trước khi deploy.
  // `site` này dùng cho canonical, og:url và sitemap.xml — sửa một chỗ này là đủ.
  site: 'https://globalchess.vn',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), sitemap()]
});
