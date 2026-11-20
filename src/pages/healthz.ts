// src/pages/healthz.ts
// Docker và Caddy hỏi trang này để biết server còn sống và đọc được SQLite.
export const prerender = false;
import type { APIRoute } from "astro";
import { getDb } from "../server/db";

export const GET: APIRoute = () => {
  try {
    getDb().prepare("SELECT 1").get();
    return new Response("ok", { headers: { "Cache-Control": "no-store" } });
  } catch {
    return new Response("db error", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};
