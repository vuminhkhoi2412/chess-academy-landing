// src/pages/uploads/[file].ts
// Phục vụ ảnh của bài đăng từ thư mục dữ liệu. Tên file là mã ngẫu nhiên đã được thu nhỏ nên cho phép
// trình duyệt lưu lâu; tên không khớp mẫu bị từ chối, không có cách đọc file nào khác trong thư mục.
export const prerender = false;
import type { APIRoute } from "astro";
import { readImage } from "../../server/uploads";

export const GET: APIRoute = async ({ params }) => {
  const data = await readImage(params.file ?? "");
  if (!data) return new Response("Không tìm thấy", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
