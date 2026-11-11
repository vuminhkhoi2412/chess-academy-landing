// src/pages/sitemap-posts.xml.ts
// Sitemap của các bài đã đăng. Sitemap tĩnh do @astrojs/sitemap sinh lúc build không biết bài mới,
// nên bài được liệt kê ở đây (đọc DB mỗi lần) và robots.txt trỏ tới cả hai.
export const prerender = false;
import type { APIRoute } from "astro";
import { getDb } from "../server/db";
import { countPublished, listPublished } from "../server/posts";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = ({ site, url }) => {
  const origin = site ?? url;
  const db = getDb();
  const posts = listPublished(db, 1, Math.max(1, countPublished(db)));
  const entries = [
    ...(posts.length ? [`<url><loc>${esc(new URL("/tin-tuc", origin).href)}</loc></url>`] : []),
    ...posts.map(
      (post) =>
        `<url><loc>${esc(new URL(`/tin-tuc/${post.slug}`, origin).href)}</loc><lastmod>${new Date(post.updatedAt).toISOString()}</lastmod></url>`,
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
