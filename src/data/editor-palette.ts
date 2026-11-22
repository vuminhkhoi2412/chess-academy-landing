// src/data/editor-palette.ts
// Sáu màu chữ chọn nhanh trong trình soạn bài. Mọi màu đều đủ tương phản trên nền trắng.
// Ngoài bảng này nhân viên vẫn chọn được màu tự do (xem RichEditor.astro).
export const EDITOR_PALETTE = [
  { name: "Đen", value: "#0f172a" },
  { name: "Xanh đậm", value: "#184268" },
  { name: "Xanh dương", value: "#1f5285" },
  { name: "Vàng hổ phách", value: "#b45309" },
  { name: "Đỏ", value: "#a3141c" },
  { name: "Xám", value: "#475569" },
] as const;
