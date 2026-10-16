# Global Chess — Landing Page

Trang giới thiệu trung tâm cờ vua Global Chess (trẻ 7 – 12 tuổi, 5 cơ sở tại TP.HCM).
Trang tĩnh, một trang duy nhất, có bàn cờ tương tác và form đăng ký tự tạo mã VietQR.

## Stack

- **Astro 7** — build tĩnh, không có server
- **React 19** — chỉ dùng cho 3 island tương tác
- **Tailwind CSS 4** — qua plugin Vite
- **chess.js** + **react-chessboard** — bàn cờ ở phần hero
- **@astrojs/sitemap** — sinh `sitemap-index.xml`

## Lệnh

| Lệnh | Việc |
| :--- | :--- |
| `npm run dev` | Dev server ở `localhost:4321` |
| `npm run build` | Build ra `./dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run check` | Typecheck Astro + TypeScript |
| `npm test` | Chạy test logic cờ vua |

Dev server chạy nền thì dùng `npx astro dev --background`, quản lý bằng
`npx astro dev status` / `stop` / `logs`.

## Cấu trúc

```
public/
  favicon.svg           logo thương hiệu (SVG)
  favicon.ico           logo 16/32/48px
  apple-touch-icon.png  icon 180px cho iOS
  og-image.png          ảnh share 1200x630
src/
  data/courses.ts       toàn bộ nội dung: thương hiệu, cơ sở, giáo trình,
                        học phí, cấu hình ngân hàng, thế cờ đố
  components/
    InteractivePuzzle.tsx    bàn cờ đố ở hero
    CurriculumExplorer.tsx   tab lộ trình Sơ cấp / Trung cấp
    PricingAndCheckout.tsx   bảng học phí + form + mã VietQR
  pages/
    index.astro         cả trang, kèm toàn bộ thẻ SEO
    robots.txt.ts       sinh robots.txt từ `site` trong astro.config.mjs
  styles/global.css     chỉ có `@import "tailwindcss";`
tests/puzzle.test.mjs   test thế cờ đố
```

## Sửa nội dung

Gần như mọi thứ nằm trong `src/data/courses.ts`: tên thương hiệu, hotline, 5 cơ sở,
lộ trình 48 buổi, 3 gói học phí, và thế cờ đố ở đầu trang.

Sửa thế cờ trong `INTERACTIVE_PUZZLE` thì chạy lại `npm test`. Test sẽ báo lỗi nếu
thế cờ mới không còn là đòn "chĩa đôi" hợp lệ (không chiếu, hoặc Đen bắt lại được quân).

## Trước khi deploy

Sửa `site` trong `astro.config.mjs` thành domain thật. Giá trị này là nguồn duy nhất
cho `canonical`, `og:url`, `sitemap-index.xml` và `robots.txt`.

Deploy trên Vercel: import repo, Vercel tự nhận diện Astro. Không cần file cấu hình.

## Lưu ý

`BANK_CONFIG` trong `src/data/courses.ts` chứa số tài khoản ngân hàng thật. Giữ repo
ở chế độ private, hoặc chuyển các giá trị này sang biến môi trường (`PUBLIC_*`) trước
khi public.
