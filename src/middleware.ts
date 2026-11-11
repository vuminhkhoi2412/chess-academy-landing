// src/middleware.ts
//
// Chặn toàn bộ /quan-tri trừ trang đăng nhập: không có phiên hợp lệ thì chuyển về đăng nhập.
// Các trang công khai đi qua mà không chạm DB.
import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "./server/auth";
import { getDb } from "./server/db";
import { ImageCache } from "./server/image-cache";
import { IMAGE_LIMIT_POLICY } from "./server/policy";
import { RateLimiter } from "./server/rate-limit";
import { SESSION_COOKIE, clientIp } from "./server/session";

const LOGIN_PATH = "/quan-tri/dang-nhap";
const imageCache = new ImageCache();
const imageLimiter = new RateLimiter(IMAGE_LIMIT_POLICY.missesPerMinute);

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const inAdmin = pathname === "/quan-tri" || pathname.startsWith("/quan-tri/");

  // Ảnh đã xử lý: nhớ trong RAM theo URL đầy đủ (có cả kích thước, định dạng) để lượt sau khỏi chạy sharp.
  if (pathname === "/_image" && context.request.method === "GET") {
    const key = context.url.search;
    const hit = imageCache.get(key);
    if (hit) return new Response(hit.body as BodyInit, { status: hit.status, headers: hit.headers });
    const width = Number(context.url.searchParams.get("w") ?? 0);
    if (width > IMAGE_LIMIT_POLICY.maxWidth) return new Response("Kích thước ảnh quá lớn", { status: 400 });
    const ip = clientIp(context.request.headers, context.clientAddress);
    if (!imageLimiter.take(ip)) {
      return new Response("Quá nhiều yêu cầu, thử lại sau.", { status: 429, headers: { "Retry-After": "60" } });
    }
    const response = await next();
    if (response.status === 200) {
      const body = new Uint8Array(await response.clone().arrayBuffer());
      imageCache.set(key, { status: 200, headers: [...response.headers], body });
    }
    return response;
  }

  if (!inAdmin) return next();

  const token = context.cookies.get(SESSION_COOKIE)?.value ?? "";
  context.locals.user = getSessionUser(getDb(), token);

  if (!context.locals.user && pathname !== LOGIN_PATH) return context.redirect(LOGIN_PATH);

  const response = await next();
  // Trang quản trị chứa dữ liệu nội bộ: không để trình duyệt hay proxy lưu lại.
  response.headers.set("Cache-Control", "no-store");
  return response;
});
