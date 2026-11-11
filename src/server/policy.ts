// src/server/policy.ts
//
// Các thông số nghiệp vụ của phần quản trị. Gom một chỗ để sau này chuyển thành cài đặt
// chỉnh được trong trang quản trị; hiện là giá trị tạm, chờ chủ trung tâm xác nhận.

export const AUTH_POLICY = {
  /** Phiên đăng nhập hết hạn sau bấy nhiêu giờ kể từ lúc đăng nhập. */
  sessionHours: 12,
  /** Sai mật khẩu bấy nhiêu lần cho cùng một tên đăng nhập trong cửa sổ khoá thì bị khoá. */
  maxFailuresPerUsername: 5,
  /** Giới hạn riêng theo địa chỉ IP, rộng hơn vì nhiều nhân viên có thể dùng chung mạng. */
  maxFailuresPerIp: 20,
  /** Độ dài cửa sổ đếm lần sai, cũng là thời gian khoá, tính bằng phút. */
  lockoutMinutes: 15,
  /** Độ dài mật khẩu tối thiểu, tính theo ký tự. */
  minPasswordLength: 10,
} as const;

export const SITE_POLICY = {
  /** Độ dài tối đa của dòng thông báo đầu trang, tính theo ký tự. */
  bannerMaxLength: 160,
} as const;

/** Bộ nhớ đệm ảnh `/_image` trong RAM (xem src/server/image-cache.ts). Chỉnh theo RAM của máy chủ. */
export const IMAGE_CACHE_POLICY = {
  maxEntries: 400,
  maxTotalBytes: 64 * 1024 * 1024,
  maxEntryBytes: 3 * 1024 * 1024,
};
