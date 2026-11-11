// src/pages/robots.txt.ts
// Sinh robots.txt từ `site` trong astro.config.mjs để không phải sửa domain 2 chỗ.
import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = site ? new URL("sitemap-index.xml", site).href : null;
  const postsSitemapUrl = site ? new URL("sitemap-posts.xml", site).href : null;

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /quan-tri",
    sitemapUrl ? `\nSitemap: ${sitemapUrl}` : "",
    postsSitemapUrl ? `Sitemap: ${postsSitemapUrl}\n` : "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
