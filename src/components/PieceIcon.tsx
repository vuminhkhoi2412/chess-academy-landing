// src/components/PieceIcon.tsx
// Quân cờ tượng trưng cho khóa, tăng dần: Tốt → Xe → Vua. Chỉ là biểu tượng, không gắn với nội dung học.
// Path lấy từ Tabler Icons (MIT, © Paweł Kuna): chess, chess-rook, chess-king.
const PIECE_PATHS: Record<string, React.ReactNode> = {
  "happy-chess": (
    <>
      <path d="M12 3a3 3 0 0 1 3 3c0 1.113 -.6 2.482 -1.5 3l1.5 7h-6l1.5 -7c-.9 -.518 -1.5 -1.887 -1.5 -3a3 3 0 0 1 3 -3" />
      <path d="M8 9h8" />
      <path d="M6.684 16.772a1 1 0 0 0 -.684 .949v1.279a1 1 0 0 0 1 1h10a1 1 0 0 0 1 -1v-1.28a1 1 0 0 0 -.684 -.948l-2.316 -.772h-6l-2.316 .772" />
    </>
  ),
  "so-cap": (
    <>
      <path d="M8 16l-1.447 .724a1 1 0 0 0 -.553 .894v2.382h12v-2.382a1 1 0 0 0 -.553 -.894l-1.447 -.724h-8" />
      <path d="M8 16l1 -9h6l1 9" />
      <path d="M6 4l.5 3h11l.5 -3" />
      <path d="M10 4v3" />
      <path d="M14 4v3" />
    </>
  ),
  "trung-cap": (
    <>
      <path d="M8 16l-1.447 .724a1 1 0 0 0 -.553 .894v2.382h12v-2.382a1 1 0 0 0 -.553 -.894l-1.447 -.724h-8" />
      <path d="M8.5 16a3.5 3.5 0 1 1 3.163 -5h.674a3.5 3.5 0 1 1 3.163 5l-7 0" />
      <path d="M9 6h6" />
      <path d="M12 3v8" />
    </>
  ),
};

/** Nét viền màu hiện tại, thân quân tô nhạt 14% cùng màu. */
export default function PieceIcon({ programId, className, strokeWidth = 2 }: { programId: string; className: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ fill: "color-mix(in srgb, currentColor 14%, transparent)" }}
      aria-hidden="true"
    >
      {PIECE_PATHS[programId]}
    </svg>
  );
}
