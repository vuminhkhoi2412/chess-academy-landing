// src/components/CentreStamp.tsx
//
// Con dấu tròn của trung tâm cho vé xác nhận: vòng chữ GLOBAL CHESS và khẩu hiệu quanh lá chắn
// logo. Lá chắn là bản tách nền từ `assets/logo.jpg` (src/assets/stamp-logo.png), được dùng làm
// mặt nạ alpha rồi tô `currentColor` nên màu mực do CSS bên ngoài quyết định (đỏ đậm #A3141C).
// Mực dập không đều nhờ bộ lọc nhiễu khoét lỗ nhỏ. Chỉ là hình trang trí nên ẩn khỏi trình đọc màn hình.
import { useId } from "react";
import stampLogo from "../assets/stamp-logo.png";

function starPoints(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 ? r * 0.42 : r;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return points.join(" ");
}

export default function CentreStamp({ className }: { className?: string }) {
  // useId có ký tự đặc biệt, không dùng được trong url(#...) nên lọc còn chữ và số.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const text = {
    fontFamily: "'Cormorant SC', serif",
    fontWeight: 700,
    fill: "currentColor",
    textAnchor: "middle" as const,
  };

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n" />
          <feColorMatrix
            in="n"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  12 0 0 0 -3"
            result="a"
          />
          <feComposite in="SourceGraphic" in2="a" operator="in" />
        </filter>
        {/* Hai đường chữ cách tâm 69 và 79 để tâm chiều cao chữ rơi đúng giữa dải 60–88,5 giữa hai vòng. */}
        <path id={`${id}-top`} d="M31 100A69 69 0 0 1 169 100" fill="none" />
        <path id={`${id}-bottom`} d="M21 100A79 79 0 0 0 179 100" fill="none" />
        <mask id={`${id}-shield`} style={{ maskType: "alpha" }}>
          <image href={stampLogo.src} x="61" y="60.4" width="78" height="85.3" preserveAspectRatio="xMidYMid meet" />
        </mask>
      </defs>
      <g filter={`url(#${id}-rough)`}>
        <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="100" cy="100" r="88.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points={starPoints(25.8, 100, 4.5)} fill="currentColor" />
        <polygon points={starPoints(174.2, 100, 4.5)} fill="currentColor" />
        <text {...text} fontSize="17" letterSpacing="2">
          <textPath href={`#${id}-top`} startOffset="50%">
            GLOBAL CHESS
          </textPath>
        </text>
        <text {...text} fontSize="15" letterSpacing="1.4">
          <textPath href={`#${id}-bottom`} startOffset="50%">
            MỘT NƯỚC ĐI · MỞ TƯ DUY
          </textPath>
        </text>
        <rect x="61" y="60.4" width="78" height="85.3" fill="currentColor" mask={`url(#${id}-shield)`} />
      </g>
    </svg>
  );
}
