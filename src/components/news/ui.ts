// src/components/news/ui.ts
// Chung cho các khối tin (trang chủ và /news): định dạng ngày dạng số và kiểu nút lọc theo mục.

/** "19/11/2026" theo giờ Việt Nam, không chữ: đi kèm biểu tượng lịch. */
export const formatDate = (ms: number) =>
  new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" }).format(ms);

/** Nút lọc theo mục: bo tròn như các nút khác của trang; mục đang chọn tô nền xanh đậm (aria-current). */
export const TAB_CLASS =
  "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-brand-800 hover:text-brand-800 aria-[current=true]:border-brand-800 aria-[current=true]:bg-brand-800 aria-[current=true]:text-white";
