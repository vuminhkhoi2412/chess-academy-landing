// src/pages/admin/logout.ts
// Chỉ nhận POST (nút "Đăng xuất" là một form), để một đường link lạ không đăng xuất được ai.
import type { APIRoute } from "astro";
import { logout } from "../../server/auth";
import { getDb } from "../../server/db";
import { SESSION_COOKIE } from "../../server/session";

export const prerender = false;

export const POST: APIRoute = ({ cookies, locals, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const user = locals.user;
    logout(getDb(), token, user ? { id: user.id, username: user.username } : null);
  }
  cookies.delete(SESSION_COOKIE, { path: "/admin" });
  return redirect("/admin/login");
};
