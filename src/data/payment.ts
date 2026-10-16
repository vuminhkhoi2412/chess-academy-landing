// src/data/payment.ts
//
// Thông tin nhận chuyển khoản cho mã VietQR.
//
// Các giá trị này lấy từ biến môi trường nên KHÔNG nằm trong git.
// - Máy local: khai trong file `.env` (đã bị .gitignore bỏ qua)
// - Vercel: Settings -> Environment Variables
//
// Lưu ý: biến `PUBLIC_*` bị Astro inline vào bundle trình duyệt, nên người xem
// trang vẫn đọc được số tài khoản qua DevTools. Muốn giấu khỏi cả người xem thì
// phải chuyển sang proxy phía server.
import {
  PUBLIC_ACB_ACCOUNT_NAME,
  PUBLIC_ACB_ACCOUNT_NO,
  PUBLIC_ACB_BANK_ID,
  PUBLIC_ACB_TEMPLATE,
} from "astro:env/client";

export const BANK_CONFIG = {
  bankId: PUBLIC_ACB_BANK_ID,
  accountNo: PUBLIC_ACB_ACCOUNT_NO,
  accountName: PUBLIC_ACB_ACCOUNT_NAME,
  template: PUBLIC_ACB_TEMPLATE,
};
