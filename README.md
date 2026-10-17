# Global Chess — Landing Page

Trang giới thiệu trung tâm cờ vua Global Chess (trẻ 4 – 12 tuổi, 5 cơ sở tại TP.HCM).
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
logo.jpg                file NGUỒN của logo, không được publish (xem TODO bên dưới)
public/
  brand/mark-64..512.png  logo khiên tách sẵn từ logo.jpg, nền trong suốt
  favicon.svg             icon tab (khiên trên nền kem)
  favicon.ico             icon 16/32/48px
  favicon-16/32/48.png    icon PNG cho trình duyệt cũ
  apple-touch-icon.png    icon 180px cho iOS
  icon-192/512.png        icon khi cài lên màn hình chính
  icon-maskable-512.png   icon maskable cho Android
  site.webmanifest        khai báo PWA (Add to home screen)
  og-image.png            ảnh share 1200x630
src/
  data/courses.ts       toàn bộ nội dung: thương hiệu, cơ sở, giáo trình,
                        học phí, thế cờ đố, FAQ, nhận xét phụ huynh
  data/payment.ts       thông tin nhận chuyển khoản, đọc từ biến môi trường
  components/
    InteractivePuzzle.tsx    bàn cờ đố ở hero
    CurriculumExplorer.tsx   tab lộ trình Sơ cấp / Trung cấp
    PricingAndCheckout.tsx   bảng học phí + form + mã VietQR
  pages/
    index.astro         cả trang, kèm toàn bộ thẻ SEO
    404.astro           trang 404
    chinh-sach-bao-mat.astro   chính sách bảo mật
    dieu-khoan-su-dung.astro   điều khoản sử dụng
    robots.txt.ts       sinh robots.txt từ `site` trong astro.config.mjs
  styles/global.css     Tailwind + `@theme` token (font, màu brand, radius, shadow)
                        và vài class trang trí cho hero
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
lộ trình Happy Chess 72 buổi & Global 48 buổi, 3 gói học phí, và thế cờ đố ở đầu trang.

Sửa thế cờ trong `INTERACTIVE_PUZZLE` thì chạy lại `npm test`. Test sẽ báo lỗi nếu
thế cờ mới không còn là đòn "chĩa đôi" hợp lệ (không chiếu, hoặc Đen bắt lại được quân).

## TODO cần nội dung thật

Bốn việc dưới đây **phải xong trước khi chạy quảng cáo**, vì hiện tại trang đang phải
dùng giải pháp tạm. Không việc nào chặn `npm run build`, nên phải tự nhớ.

### 1. Ảnh và thước phim thật của trung tâm (hero + gallery)

- **Hiện tại:** phần hero không dùng ảnh nào. Độ sâu được dựng hoàn toàn bằng hình học
  (mesh gradient, mặt bàn cờ nghiêng theo phối cảnh, ký hiệu nước đi, hạt nhiễu). Không
  có ảnh nào giả làm lớp học thật.
- **Cần:** ảnh lớp học, phòng học, giải đấu nội bộ; nếu có thì cả footage quay ngắn.
- **Việc phải làm:** thay lớp trang trí trong `src/pages/index.astro` (khối
  `<div aria-hidden="true">` ngay dưới `<!-- Hero Section -->`) bằng gallery ảnh thật,
  hoặc thêm một section gallery riêng. Chỗ này đã có comment `TODO (nội dung thật)`.
- **Bắt buộc:** xin phép phụ huynh trước khi đăng ảnh hoặc video có mặt trẻ.

### 2. Nhận xét thật của phụ huynh

- **Hiện tại:** mục "Phụ Huynh Nói Gì Về Global Chess" hiển thị 3 ô TODO viền nét đứt,
  kèm cảnh báo "không đăng trang khi còn như vậy". Mảng `TESTIMONIALS` trong
  `src/data/courses.ts` đang **cố ý để trống**.
- **Cần:** 3 câu trích dẫn thật, kèm tên phụ huynh và cơ sở.
- **Việc phải làm:** điền vào `TESTIMONIALS` theo cấu trúc ghi trong comment ngay trên
  mảng đó. Điền đủ 3 mục là giao diện tự chuyển sang bản thật, không phải sửa HTML.
- **Không được:** tự viết nhận xét. Đó là quảng cáo sai sự thật.

### 3. `logo.jpg` ở thư mục gốc

- **Hiện tại:** file nguồn 920x813, JPEG, **nền trắng và không có alpha**. Chỉ nằm trong
  repo, không được publish (chỉ `public/` mới lên web). Toàn bộ asset thương hiệu đã
  được tách sẵn từ file này ra `public/`, nên lúc chạy trang không cần file gốc.
- **Vì sao không dùng trực tiếp:** đây là lockup đầy đủ (khiên + chữ + tagline) nên đặt
  vào nav sẽ trùng tên thương hiệu và dán một ô trắng lên nền kem. Ở 16px thì không đọc được.
- **Việc phải làm:** chuyển vào thư mục nguồn không publish (ví dụ `assets/`) hoặc xoá.
- **Nếu phải tách lại asset từ file này:** xoá nền bằng cách **loang từ viền vào trong**,
  không key theo độ sáng — key theo độ sáng sẽ xoá luôn bàn cờ caro và vệt phản chiếu
  **bên trong** khiên.

### 4. Học phí lộ trình Happy Chess

- **Hiện tại:** bảng học phí chỉ có 3 gói của lộ trình Global (24 buổi: 3.600.000đ;
  trọn gói 48 buổi: 6.500.000đ; kèm riêng 1-1 12 buổi: 4.800.000đ) và chưa được trung tâm
  xác nhận. Lộ trình Happy Chess (72 buổi, 3 Level × 24 buổi) chưa có mức giá riêng, nên
  HC1/HC2/HC3 trong `LEVEL_OPTIONS` (`src/components/PricingAndCheckout.tsx`) đang tạm
  gán `packageId: "hoc-phan-24"`.
- **Cần:** xác nhận 3 mức giá hiện có, học phí chính thức cho Happy Chess, và Happy Chess
  tính theo mức 24 buổi chung hay có mức riêng cho bé 4–6 tuổi. Xác nhận luôn "Lớp kèm
  riêng 1-1" nằm trong lộ trình chuẩn hay là dịch vụ riêng.
- **Việc phải làm:** cập nhật `PRICING_PACKAGES` trong `src/data/courses.ts` và
  `LEVEL_OPTIONS` trong `src/components/PricingAndCheckout.tsx` khi có giá thật.

## Trước khi deploy

Loại hết mục **TODO cần nội dung thật** ở trên trước. Checklist, làm đủ 4 bước:

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

Placeholder URL chỉ có **một** chỗ: `site` trong `astro.config.mjs` (đang là
`https://globalchess.vn`, có comment `TODO` ngay trên dòng đó). Mọi URL khác trong trang
đều suy ra từ `Astro.site`.

Phần nội dung còn thiếu (ảnh thật, nhận xét phụ huynh, học phí Happy Chess) không nằm ở đây mà ở mục
**TODO cần nội dung thật** phía trên.

Thông tin ngân hàng không nằm trong code mà ở `.env` local và biến môi trường của Vercel.

Số điện thoại và địa chỉ 5 cơ sở trong `src/data/courses.ts` là dữ liệu thật của trung tâm.
Học phí thì chưa đối chiếu được với trung tâm — xem mục **TODO** số 4.

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
