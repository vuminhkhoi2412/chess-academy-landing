// src/server/session.ts
//
// Những chi tiết HTTP dùng chung của phiên đăng nhập: tên cookie, địa chỉ IP, định dạng giờ.

export const SESSION_COOKIE = "gc_session";

/**
 * Địa chỉ IP của người gọi, dùng để đếm lần đăng nhập sai.
 * Sau Caddy/Nginx, địa chỉ socket luôn là của proxy, nên khi đặt TRUST_PROXY=1 ta lấy địa chỉ
 * proxy ghi thêm vào CUỐI X-Forwarded-For (giá trị đầu có thể do người gọi tự điền).
 * Chỉ bật TRUST_PROXY khi server chỉ nhận request qua proxy đó.
 */
export function clientIp(headers: Headers, socketAddress: string | undefined): string {
  if (process.env.TRUST_PROXY === "1") {
    const parts = headers.get("x-forwarded-for")?.split(",") ?? [];
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return socketAddress ?? "unknown";
}

const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  dateStyle: "short",
  timeStyle: "short",
});

export const formatTime = (ms: number): string => timeFormat.format(new Date(ms));
