# Global Chess — Landing Page

Trang giới thiệu trung tâm cờ vua Global Chess (trẻ 4 – 12 tuổi, 5 cơ sở tại TP.HCM).
Trang tĩnh, một trang duy nhất, có bàn cờ tương tác, gallery ảnh lớp học và form đăng ký gửi thẳng sang Google Sheets của trung tâm.

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
assets/
  logo.jpg                file NGUỒN của logo, không được publish
  nguon/bang-hoc-phi-global-chess.pdf   bảng học phí gốc của trung tâm
  nguon/trichdan.txt      trích dẫn gốc của phụ huynh
  nguon/hinh-anh/         file gốc 5 ảnh + NGUON.md ghi Drive ID và consent
DESIGN.md                 quy ước thiết kế: màu, chữ, chuyển động, chống mẫu AI
google-apps-script/
  Code.gs                 bản nguồn Apps Script để dán vào sheet (không được build)
docs/
  google-sheets-setup.md  hướng dẫn deploy Apps Script, khai endpoint
  lo_trinh_hoc.md         tài liệu chuẩn của trung tâm (lộ trình, giáo trình)
  superpowers/plans/      plan triển khai đã thực hiện
public/
  brand/mark-64..512.png  logo khiên tách sẵn từ assets/logo.jpg, nền trong suốt
  favicon.svg             icon tab (khiên trên nền kem)
  favicon.ico             icon 16/32/48px
  favicon-16/32/48.png    icon PNG cho trình duyệt cũ
  apple-touch-icon.png    icon 180px cho iOS
  icon-192/512.png        icon khi cài lên màn hình chính
  icon-maskable-512.png   icon maskable cho Android
  site.webmanifest        khai báo PWA (Add to home screen)
  og-image.png            ảnh share 1200x630
src/
  assets/images/        5 ảnh gallery đã crop, Astro tối ưu WebP khi build
  layouts/Layout.astro  khung HTML dùng chung: <head>, favicon, font, SEO
  data/courses.ts       toàn bộ nội dung: thương hiệu, cơ sở, giáo trình,
                        học phí, thế cờ đố, FAQ, nhận xét phụ huynh
  lib/enrolment.ts      kiểm tra, dựng và gửi payload đăng ký (test được bằng node --test)
  components/
    InteractivePuzzle.tsx    bàn cờ đố ở hero
    CurriculumExplorer.tsx   tab 3 lộ trình: Happy Chess / Sơ cấp / Trung cấp
    PricingAndCheckout.tsx   bảng học phí + form đăng ký gửi Google Sheets
    SiteHeader.astro         thanh nav dùng chung (kèm menu di động ở trang chủ)
    SiteFooter.astro         chân trang dùng chung cho cả bốn trang
    MobileContactBar.astro   thanh gọi điện / Zalo cố định ở đáy màn hình điện thoại
  pages/
    index.astro         cả trang, kèm toàn bộ thẻ SEO
    404.astro           trang 404
    chinh-sach-bao-mat.astro   chính sách bảo mật
    dieu-khoan-su-dung.astro   điều khoản sử dụng
    robots.txt.ts       sinh robots.txt từ `site` trong astro.config.mjs
  styles/global.css     Tailwind + `@theme` token (font, màu brand, radius, shadow)
                        và các class dùng chung: nhãn mục (.gc-eyebrow), tiêu đề mục
                        (.gc-section-title), mặt phẳng bàn cờ, hạt mịn
tests/
  puzzle.test.mjs       test thế cờ đố
  curriculum.test.mjs   test dữ liệu 3 lộ trình
  tuition.test.mjs      test bảng học phí chính thức
```

`assets/logo.jpg` là file gốc duy nhất không publish (920x813, JPEG, nền trắng, không alpha).
Nếu phải tách lại asset từ file này: xoá nền bằng cách **loang từ viền vào trong**,
không key theo độ sáng — key theo độ sáng sẽ xoá luôn bàn cờ caro và vệt phản chiếu
**bên trong** khiên.

## Biến môi trường

URL của Google Apps Script nhận đăng ký không nằm trong git. Copy `.env.example` thành `.env`
rồi điền giá trị thật (cách lấy URL: `docs/google-sheets-setup.md`):

| Biến | Bắt buộc | Mặc định |
| :--- | :--- | :--- |
| `PUBLIC_GOOGLE_SHEETS_ENDPOINT` | có | — |

Thiếu biến bắt buộc thì `npm run build` báo lỗi ngay, không deploy một form không gửi được đi đâu.

Lưu ý: biến `PUBLIC_*` bị inline vào bundle trình duyệt, nên ai đọc source cũng thấy URL
endpoint và có thể gửi rác vào sheet. Ô ẩn `_hp` chặn bot ngây thơ; dòng rác thì quản lý
xoá tay. Muốn chặn triệt để phải thêm một proxy phía server.

## Sửa nội dung

Gần như mọi thứ nằm trong `src/data/courses.ts`: tên thương hiệu, hotline, 5 cơ sở,
lộ trình Happy Chess 72 buổi & Global 48 buổi, bảng học phí 7 cấp độ, nhận xét phụ huynh
và thế cờ đố ở đầu trang.

Sửa thế cờ trong `INTERACTIVE_PUZZLE` thì chạy lại `npm test`. Test sẽ báo lỗi nếu
thế cờ mới không còn là đòn "chĩa đôi" hợp lệ (không chiếu, hoặc Đen bắt lại được quân).

## Học phí

Nguồn duy nhất: `assets/nguon/bang-hoc-phi-global-chess.pdf` (bảng chính thức của trung tâm).
Dữ liệu nằm trong `TUITION_LEVELS` và `TUITION_PROGRAMS` (`src/data/courses.ts`), được khóa
bởi `tests/tuition.test.mjs`.

| Cấp độ | Thời lượng | Group 12 buổi | Group 24 buổi | 1 kèm 1 | 1 kèm 2 |
| :--- | :-- | --: | --: | --: | --: |
| Happy Chess 1–3 | 60 phút | 1.800.000đ | 2.700.000đ | 350.000đ/buổi | 250.000đ/buổi |
| Sơ cấp 1 (Global 1,2) | 60 phút | 2.100.000đ | 3.240.000đ | 400.000đ/buổi | 300.000đ/buổi |
| Sơ cấp 2 (Global 3,4) | 90 phút | 2.700.000đ | 4.860.000đ | 400.000đ/buổi | 300.000đ/buổi |
| Trung cấp 1 (Global 5,6) | 90 phút | 3.240.000đ | 5.830.000đ | 450.000đ/buổi | 350.000đ/buổi |
| Trung cấp 2 (Global 7,8) | 90 phút | 3.888.000đ | 6.996.000đ | 450.000đ/buổi | 350.000đ/buổi |

Global Chess 9–10 (Chuyên nghiệp) có giá theo cấp kiện tướng nên chưa mở trong form.

Cách ghép mã cấp độ: SC1 = Global 1,2; SC2 = Global 3,4; TC1 = Global 5,6;
TC2 = Global 7,8. Lớp 1 kèm 1 / 1 kèm 2 tính đơn giá mỗi buổi; form cho chọn 12 hoặc
24 buổi rồi nhân với đơn giá.

Đồ dùng bán riêng: sách học 50.000đ, sách bài tập bổ trợ 90.000đ, áo đồng phục 150.000đ,
bộ cờ tiêu chuẩn thi đấu 250.000đ, đồng hồ thi đấu 400.000đ. Vì vậy website không ghi
"tặng kèm giáo trình" nữa.

Sửa giá: cập nhật `TUITION_LEVELS`, cập nhật số kỳ vọng trong `tests/tuition.test.mjs`,
rồi chạy `npm test`.

## Hình ảnh

Gallery `#hinh-anh` dùng 5 ảnh thật của trung tâm, không dùng stock/AI. Ảnh gốc nằm ở
`assets/nguon/hinh-anh/`; bản crop trong `src/assets/images/` đã bỏ banner/logo in sẵn
trên ảnh. Astro sinh WebP và srcset khi build.

- Ảnh đã có sự đồng ý của phụ huynh cho việc dùng trên website. Không thay bằng ảnh
  khác nếu chưa xác nhận lại consent.
- Không gắn tên cơ sở vào alt text vì nguồn ảnh không ghi rõ ảnh chụp ở cơ sở nào.
- Chưa có ảnh mặt tiền/phòng học riêng cho 5 cơ sở, nên 5 thẻ cơ sở vẫn chỉ có phần chữ.
  Nếu bổ sung, dùng ảnh 4:3 và thêm vào `BRANCHES`/markup tương ứng.
- Video trong folder nguồn là 720×1280 dọc, 55 giây, có overlay kiểu TikTok + hotline;
  chưa dùng. Nếu muốn dùng video, cần bản ngang 1080p, ngắn 10–20 giây, không chữ đè.

## Trước khi deploy

Phần ảnh gallery đã xong; còn cấu hình domain, biến môi trường và deploy. Checklist, làm đủ 4 bước:

1. **Đổi domain.** Sửa `site` trong `astro.config.mjs` từ `https://globalchess.vn` sang
   domain thật. Đây là nguồn duy nhất cho `canonical`, `og:url`, `robots.txt` và
   `sitemap-index.xml`; không có chỗ nào khác hardcode domain.
2. **Deploy Apps Script và khai biến môi trường trên Vercel:** làm theo
   `docs/google-sheets-setup.md` để lấy URL `/exec`, rồi khai `PUBLIC_GOOGLE_SHEETS_ENDPOINT`
   ở Project Settings → Environment Variables, chọn cả Production và Preview. Thiếu biến
   là build trên Vercel đỗ. Siết quyền chia sẻ của sheet trước khi nhận đăng ký thật.
3. **Chạy lại 3 lệnh kiểm tra:** `npm run check`, `npm test`, `npm run build`.
   Cả 3 phải sạch trước khi push.
4. **Deploy.** Import repo vào Vercel, Vercel tự nhận diện Astro, không cần file cấu
   hình. Sau khi deploy, mở `/robots.txt` và `/sitemap-index.xml` để chắc domain đã đúng.

## Placeholder cần đổi

Placeholder URL chỉ có **một** chỗ: `site` trong `astro.config.mjs` (đang là
`https://globalchess.vn`, có comment `TODO` ngay trên dòng đó). Mọi URL khác trong trang
đều suy ra từ `Astro.site`.

Ảnh thật đã nằm trong `src/assets/images/` và gallery `#hinh-anh`; không còn placeholder ảnh.

URL Google Apps Script không nằm trong code mà ở `.env` local và biến môi trường của Vercel.

Số điện thoại, địa chỉ 5 cơ sở và bảng học phí trong `src/data/courses.ts` là dữ liệu thật
của trung tâm. Học phí lấy từ `assets/nguon/bang-hoc-phi-global-chess.pdf` — xem mục
**Học phí** phía trên.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân | Cách sửa |
| :--- | :--- | :--- |
| Cả 3 island không bấm được, console báo `504 (Outdated Optimize Dep)` | Vite cache cũ trong `node_modules/.vite`, thường sau khi sửa `astro.config.mjs` | `npx astro dev stop`, xoá `node_modules\.vite`, `npx astro dev --background` |
| Lệnh `astro` báo không tìm thấy | `astro` không có trong PATH | chạy qua `npx`, ví dụ `npx astro dev stop` |
| Build đỗ với dòng `PUBLIC_GOOGLE_SHEETS_ENDPOINT is missing` | thiếu biến môi trường | tạo `.env` từ `.env.example` ở local, khai trên Vercel khi deploy |
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
