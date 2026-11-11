// src/middleware.ts
//
// Chặn toàn bộ /quan-tri trừ trang đăng nhập: không có phiên hợp lệ thì chuyển về đăng nhập.
// Các trang công khai đi qua mà không chạm DB.
import { defineMiddleware } from "astro:middleware";
import { getSessionUser } from "./server/auth";
import { getDb } from "./server/db";
import { SESSION_COOKIE } from "./server/session";

const LOGIN_PATH = "/quan-tri/dang-nhap";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const inAdmin = pathname === "/quan-tri" || pathname.startsWith("/quan-tri/");
  if (!inAdmin) return next();

  const token = context.cookies.get(SESSION_COOKIE)?.value ?? "";
  context.locals.user = getSessionUser(getDb(), token);

  if (!context.locals.user && pathname !== LOGIN_PATH) return context.redirect(LOGIN_PATH);

  const response = await next();
  // Trang quản trị chứa dữ liệu nội bộ: không để trình duyệt hay proxy lưu lại.
  response.headers.set("Cache-Control", "no-store");
  return response;
});
