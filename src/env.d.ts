/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    /** Người đang đăng nhập vào trang quản trị, hoặc null. Chỉ được gán cho đường dẫn /quan-tri. */
    user: import("./server/auth").SessionUser | null;
  }
}
