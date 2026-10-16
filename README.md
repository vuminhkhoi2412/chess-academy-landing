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
                        học phí, thế cờ đố
  data/payment.ts       thông tin nhận chuyển khoản, đọc từ biến môi trường
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

## Biến môi trường

Thông tin nhận chuyển khoản không nằm trong git. Copy `.env.example` thành `.env`
rồi điền giá trị thật:

| Biến | Bắt buộc | Mặc định |
| :--- | :--- | :--- |
| `PUBLIC_ACB_BANK_ID` | không | `ACB` |
| `PUBLIC_ACB_ACCOUNT_NO` | có | — |
| `PUBLIC_ACB_ACCOUNT_NAME` | có | — |
| `PUBLIC_ACB_TEMPLATE` | không | `compact2` |

Thiếu biến bắt buộc thì `npm run build` báo lỗi ngay, không tạo mã QR sai âm thầm.

Lưu ý: biến `PUBLIC_*` bị inline vào bundle trình duyệt, nên người xem trang vẫn đọc
được số tài khoản qua DevTools. Muốn giấu cả khỏi người xem thì phải thêm một endpoint
phía server làm proxy cho ảnh VietQR và dùng biến không có tiền tố `PUBLIC_`.

## Sửa nội dung

Gần như mọi thứ nằm trong `src/data/courses.ts`: tên thương hiệu, hotline, 5 cơ sở,
lộ trình 48 buổi, 3 gói học phí, và thế cờ đố ở đầu trang.

Sửa thế cờ trong `INTERACTIVE_PUZZLE` thì chạy lại `npm test`. Test sẽ báo lỗi nếu
thế cờ mới không còn là đòn "chĩa đôi" hợp lệ (không chiếu, hoặc Đen bắt lại được quân).

## Trước khi deploy

Checklist, làm đủ 4 bước:

1. **Đổi domain.** Sửa `site` trong `astro.config.mjs` từ `https://globalchess.vn` sang
   domain thật. Đây là nguồn duy nhất cho `canonical`, `og:url`, `robots.txt` và
   `sitemap-index.xml`; không có chỗ nào khác hardcode domain.
2. **Khai 4 biến môi trường trên Vercel:** `PUBLIC_ACB_BANK_ID`,
   `PUBLIC_ACB_ACCOUNT_NO`, `PUBLIC_ACB_ACCOUNT_NAME`, `PUBLIC_ACB_TEMPLATE`
   (giá trị xem bảng ở phần Biến môi trường). Khai ở Project Settings → Environment
   Variables, chọn cả Production và Preview. Thiếu `PUBLIC_ACB_ACCOUNT_NO` hoặc
   `PUBLIC_ACB_ACCOUNT_NAME` là build trên Vercel đỗ.
3. **Chạy lại 3 lệnh kiểm tra:** `npm run check`, `npm test`, `npm run build`.
   Cả 3 phải sạch trước khi push.
4. **Deploy.** Import repo vào Vercel, Vercel tự nhận diện Astro, không cần file cấu
   hình. Sau khi deploy, mở `/robots.txt` và `/sitemap-index.xml` để chắc domain đã đúng.

## Placeholder cần đổi

Chỉ có **một** chỗ: `site` trong `astro.config.mjs` (đang là `https://globalchess.vn`,
có comment `TODO` ngay trên dòng đó). Mọi URL khác trong trang đều suy ra từ `Astro.site`.

Thông tin ngân hàng không nằm trong code mà ở `.env` local và biến môi trường của Vercel.

Số điện thoại, địa chỉ 5 cơ sở, học phí trong `src/data/courses.ts` là dữ liệu thật của
trung tâm, không phải placeholder.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân | Cách sửa |
| :--- | :--- | :--- |
| Cả 3 island không bấm được, console báo `504 (Outdated Optimize Dep)` | Vite cache cũ trong `node_modules/.vite`, thường sau khi sửa `astro.config.mjs` | `npx astro dev stop`, xoá `node_modules\.vite`, `npx astro dev --background` |
| Lệnh `astro` báo không tìm thấy | `astro` không có trong PATH | chạy qua `npx`, ví dụ `npx astro dev stop` |
| Build đỗ với dòng `PUBLIC_ACB_ACCOUNT_NO is missing` | thiếu biến môi trường | tạo `.env` từ `.env.example` ở local, khai trên Vercel khi deploy |
| Island chưa hiện ngay sau khi reload | Astro hydrate sau sự kiện `load` | chờ thêm, không phải lỗi |

Xoá cache Vite, đúng thứ tự:

```
npx astro dev stop
Remove-Item -Recurse -Force node_modules\.vite
npx astro dev --background
npx astro dev status
```

Trên macOS/Linux thì thay dòng thứ hai bằng `rm -rf node_modules/.vite`.

## Lưu ý

Số tài khoản thật vẫn còn trong commit `9e05ddc`. Repo đang private nên chỉ người có
quyền mới thấy lịch sử đó. Nếu sau này chuyển repo sang public thì phải viết lại lịch
sử (`git filter-repo`) rồi `push --force`, chứ xoá trong file thôi là không đủ.
