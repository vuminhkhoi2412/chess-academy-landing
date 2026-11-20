# Global Chess — Cổng thông tin

Website của trung tâm cờ vua Global Chess (trẻ 4 – 12 tuổi, 5 cơ sở tại TP.HCM): trang chủ,
giới thiệu, khoá học và học phí, các cơ sở, tin tức/kiến thức, đăng ký học thử (gửi thẳng sang
Google Sheets của trung tâm) và trang quản trị cho nhân viên. Trang chủ có bàn cờ đấu với máy
(Stockfish chạy ngay trong trình duyệt của khách).

Đang làm trên nhánh `redesign/portal` (redesign theo từng đợt, xem `docs/redesign-brief.md`);
việc chưa làm ở `docs/backlog.md`.

## Stack

- **Astro 7** với adapter **Node** (`standalone`). Trang công khai không phụ thuộc dữ liệu thì build tĩnh;
  trang chủ, `/news` và `/admin` chạy trên server Node và đọc SQLite
- **React 19** — các island tương tác: bàn cờ đấu máy, giáo trình, học phí + form đăng ký, trình soạn bài
- **Tailwind CSS 4** — qua plugin Vite
- **SQLite** (`node:sqlite`) — tài khoản, nhật ký, bài đăng, banner, học phí chỉnh tay, công tắc tính năng
- **chess.js** + **react-chessboard** + **Stockfish 19 (WASM, GPL-3.0)** ở `public/engine/`
- **Tiptap** — trình soạn bài trong quản trị; HTML lưu ra được lọc bằng `sanitize-html`
- **@astrojs/sitemap** — `sitemap-index.xml`, kèm `sitemap-posts.xml` cho bài đăng
- **Docker + Caddy** — đóng gói và HTTPS (xem cuối file)

## Lệnh

| Lệnh | Việc |
| :--- | :--- |
| `npm run dev` | Dev server ở `localhost:4321` |
| `npm run build` | Build ra `./dist/` (cần `.env`, xem "Biến môi trường") |
| `npm run build && node dist/server/entry.mjs` | Chạy bản production, cổng 4321 (đổi bằng `PORT`, `HOST`) |
| `npm run check` | Typecheck Astro + TypeScript |
| `npm test` | Test dữ liệu, đăng ký, đăng nhập, bài đăng, banner, công tắc, học phí, liên kết |
| `npm run admin:create -- ten.dang.nhap "Tên hiển thị"` | Tạo quản trị đầu tiên (hỏi mật khẩu, hoặc đặt `ADMIN_PASSWORD`) |
| `npm run admin:reset -- ten.dang.nhap` | Đặt lại mật khẩu |

Dev server chạy nền: `npx astro dev --background`, quản lý bằng `npx astro dev status` / `stop` / `logs`.

## Trang quản trị (`/admin`)

Cần server Node (không chạy được trên hosting tĩnh). Dữ liệu ở `$DATA_DIR/app.db` (mặc định `./data`),
ảnh tải lên ở `$DATA_DIR/uploads`. Thông số đăng nhập (số lần sai tối đa, thời gian khoá, độ dài
mật khẩu, hạn phiên) nằm ở `src/server/policy.ts`.

| Trang | Việc |
| :--- | :--- |
| `/admin` | Tổng quan |
| `/admin/posts` | Bài đăng: soạn, ảnh bìa và ảnh đính kèm (xác nhận phụ huynh đồng ý, xoá EXIF), nháp/đăng |
| `/admin/categories` | Mục bài đăng (Tin tức, Kiến thức, …) |
| `/admin/slides` | Banner trang chủ |
| `/admin/features` | Bật/tắt tính năng trang chủ, dòng thông báo, cấp độ và màu quân của bàn cờ đấu máy |
| `/admin/tuition` | Học phí và phụ phí (nhân viên xem, chỉ Quản trị sửa). Giá gốc từ `src/data/courses.ts`, giá sửa lưu trong DB; mọi lần đổi ghi nhật ký |
| `/admin/accounts` | Tài khoản nhân viên (chỉ Quản trị) |
| `/admin/activity` | Nhật ký thao tác |

## Cấu trúc

```
assets/
  logo.jpg                file NGUỒN của logo, không được publish
  nguon/bang-hoc-phi-global-chess.pdf   bảng học phí gốc của trung tâm
  nguon/trichdan.txt      trích dẫn gốc của phụ huynh
  nguon/hinh-anh/         file gốc 5 ảnh + NGUON.md ghi Drive ID và consent
  nguon/Tham khảo hero.png  ảnh tham khảo bố cục hero
DESIGN.md                 quy ước thiết kế: màu, chữ, chuyển động, chống mẫu AI
google-apps-script/
  Code.gs                 bản nguồn Apps Script để dán vào sheet (không được build)
docs/
  google-sheets-setup.md  hướng dẫn deploy Apps Script, khai endpoint
  lo_trinh_hoc.md         tài liệu chuẩn của trung tâm (lộ trình, giáo trình)
  redesign-brief.md       quyết định của đợt redesign
  backlog.md              việc đã chốt nhưng chưa làm
  docker-local.md         chạy thử bằng Docker
  design-options/         các bản mẫu HTML để chọn phương án thiết kế
  superpowers/            plan và spec đã thực hiện
scripts/                  create-admin, reset-password
loadtest/k6.js            thử tải
Dockerfile, docker-compose.yml, Caddyfile   đóng gói và HTTPS
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
  assets/images/anh_chan_dung/  3 ảnh chân dung tròn ở hero (đã có consent phụ huynh)
  layouts/Layout.astro  khung HTML dùng chung: <head>, favicon, font, SEO
  data/courses.ts       nội dung: thương hiệu, cơ sở, giáo trình, giá học phí gốc,
                        phụ phí, FAQ, nhận xét phụ huynh
  data/chess-engine.ts  cấp độ và màu quân của bàn cờ đấu máy
  server/               SQLite và logic quản trị: auth, session, posts, categories,
                        slides, flags, tuition, uploads, rich-text (lọc HTML), rate-limit
  lib/enrolment.ts      kiểm tra, dựng và gửi payload đăng ký (test được bằng node --test)
  lib/clack.ts          phát tiếng đi quân từ public/sounds/move-self.mp3
  components/
    ChessChallenge.tsx       bàn cờ đấu với máy ở hero (Stockfish WASM trong Web Worker, file ở public/engine/)
    CurriculumExplorer.tsx   tab 3 lộ trình: Happy Chess / Sơ cấp / Trung cấp
    PricingAndCheckout.tsx   bảng học phí; prop `form` (mặc định bật) dựng form đăng ký, tắt ở /courses
    EnrolmentForm.tsx        form đăng ký gửi Google Sheets (trang chủ và /trial; đọc ?branch=<mã cơ sở>)
    home/                    các khối của trang chủ (banner, tin, nổi bật, cơ sở, gallery, nhận xét, FAQ)
    news/                    thẻ và ô dùng ở /news và trang chủ
    admin/RichEditor.tsx     trình soạn bài Tiptap
    SiteHeader.astro         thanh nav dùng chung (kèm menu di động)
    SiteFooter.astro         chân trang dùng chung cho mọi trang công khai
    MobileContactBar.astro   thanh gọi điện / Zalo cố định ở đáy màn hình điện thoại
  pages/
    index.astro         trang chủ, kèm toàn bộ thẻ SEO
    about.astro         giới thiệu
    courses.astro       giáo trình và học phí (nút "Đăng ký ngay" dẫn sang /trial)
    branches.astro      các cơ sở (nút "Chọn cơ sở này" dẫn sang /trial?branch=<mã>)
    trial.astro         đăng ký học thử; form đóng thì hiện hotline và Zalo
    news/               danh sách (có lọc theo mục) và bài đăng
    admin/              trang quản trị (bảng ở trên)
    uploads/            phục vụ ảnh tải lên
    healthz.ts          kiểm tra sức khoẻ cho Docker
    sitemap-posts.xml.ts   sitemap bài đăng
    404.astro           trang 404
    privacy-policy.astro   chính sách bảo mật
    terms.astro   điều khoản sử dụng
    robots.txt.ts       sinh robots.txt từ `site` trong astro.config.mjs
  styles/global.css     Tailwind + `@theme` token (font, màu brand, radius, shadow)
                        và các class dùng chung: nhãn mục (.gc-eyebrow), tiêu đề mục
                        (.gc-section-title), mặt phẳng bàn cờ, hạt mịn
tests/                  chạy bằng `npm test`
  curriculum / tuition    dữ liệu lộ trình và bảng học phí chính thức
  enrolment / apps-script payload đăng ký và bản nguồn Apps Script
  auth / posts / categories / slides / flags   phần quản trị
  links.test.mjs          mọi liên kết nội bộ ở menu, chân trang, banner, thẻ cơ sở phải có trang thật
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

Nội dung cố định nằm trong `src/data/courses.ts`: tên thương hiệu, hotline, 5 cơ sở,
lộ trình Happy Chess 72 buổi & Global 48 buổi, giá học phí gốc, nhận xét phụ huynh, FAQ.
Phần nhân viên tự chỉnh được (bài đăng, banner, công tắc tính năng, học phí, phụ phí)
làm trong `/admin`.

## Học phí

Nguồn gốc: `assets/nguon/bang-hoc-phi-global-chess.pdf` (bảng chính thức của trung tâm).
Giá gốc nằm trong `TUITION_LEVELS` và `EXTRA_FEES` (`src/data/courses.ts`), được khoá bởi
`tests/tuition.test.mjs`. Giá hiện hành = giá Quản trị đã sửa ở `/admin/tuition` nếu có, không thì giá gốc.

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

Đổi giá thường ngày: Quản trị sửa ở `/admin/tuition`. Đổi giá gốc (khi có bảng giá mới):
cập nhật `TUITION_LEVELS`, số kỳ vọng trong `tests/tuition.test.mjs`, rồi chạy `npm test`.

## Hình ảnh

Gallery `#gallery` (trang chủ) dùng 5 ảnh thật của trung tâm, không dùng stock/AI. Ảnh gốc nằm ở
`assets/nguon/hinh-anh/`; bản crop trong `src/assets/images/` đã bỏ banner/logo in sẵn
trên ảnh. Astro sinh WebP và srcset khi build.

- Ba ảnh chân dung ở hero (`src/assets/images/anh_chan_dung/`) được cắt tròn quanh khuôn mặt
  bằng `heroFaces` trong `index.astro` (`pos`, `origin`, `zoom`); đổi ảnh thì chỉnh lại ba số này.
- Ảnh đã có sự đồng ý của phụ huynh cho việc dùng trên website. Không thay bằng ảnh
  khác nếu chưa xác nhận lại consent.
- Không gắn tên cơ sở vào alt text vì nguồn ảnh không ghi rõ ảnh chụp ở cơ sở nào.
- Chưa có ảnh mặt tiền/phòng học riêng cho 5 cơ sở, nên 5 thẻ cơ sở vẫn chỉ có phần chữ.
  Nếu bổ sung, dùng ảnh 4:3 và thêm vào `BRANCHES`/markup tương ứng.
- Video trong folder nguồn là 720×1280 dọc, 55 giây, có overlay kiểu TikTok + hotline;
  chưa dùng. Nếu muốn dùng video, cần bản ngang 1080p, ngắn 10–20 giây, không chữ đè.

## Trước khi deploy

Cách chạy thật là Docker + Caddy trên một máy chủ (xem `docs/docker-local.md`); không dùng Vercel
vì trang quản trị cần server Node và ổ lưu trữ bền. Checklist:

1. **Domain:** `site` trong `astro.config.mjs` là `https://globalchess.edu.vn`, nguồn duy nhất cho
   `canonical`, `og:url`, `robots.txt` và sitemap. Tên miền khác thì sửa thêm `security.allowedDomains`
   cùng file đó, nếu không mọi form POST bị 403.
2. **Apps Script:** làm theo `docs/google-sheets-setup.md` để lấy URL `/exec`, khai
   `PUBLIC_GOOGLE_SHEETS_ENDPOINT` trong `.env` (hoặc `build.args` của compose). Siết quyền chia sẻ
   của sheet trước khi nhận đăng ký thật.
3. **Kiểm tra:** `npm run check`, `npm test`, `npm run build` đều sạch.
4. **Chạy:** `SITE_ADDRESS=globalchess.edu.vn`, `HTTP_PORT=80`, `HTTPS_PORT=443`, DNS trỏ về máy chủ,
   `docker compose up -d --build`, rồi `docker compose exec app npm run admin:create -- ...`.
   Sau đó mở `/robots.txt` và `/sitemap-index.xml` xem domain đã đúng.
5. **Sao lưu:** volume `gc_data` (`app.db` và `uploads`) chưa có sao lưu tự động (xem `docs/backlog.md`).

## Domain

Domain chỉ khai ở **một** chỗ: `site` trong `astro.config.mjs`. Mọi URL khác đều suy ra từ `Astro.site`.

URL Google Apps Script không nằm trong code mà ở `.env` local và lúc build.

Số điện thoại, địa chỉ 5 cơ sở và bảng học phí trong `src/data/courses.ts` là dữ liệu thật
của trung tâm. Học phí xem mục **Học phí** phía trên.

## Xử lý sự cố

| Hiện tượng | Nguyên nhân | Cách sửa |
| :--- | :--- | :--- |
| Cả 3 island không bấm được, console báo `504 (Outdated Optimize Dep)` | Vite cache cũ trong `node_modules/.vite`, thường sau khi sửa `astro.config.mjs` | `npx astro dev stop`, xoá `node_modules\.vite`, `npx astro dev --background` |
| Lệnh `astro` báo không tìm thấy | `astro` không có trong PATH | chạy qua `npx`, ví dụ `npx astro dev stop` |
| Build đỗ với dòng `PUBLIC_GOOGLE_SHEETS_ENDPOINT is missing` | thiếu biến môi trường | tạo `.env` từ `.env.example` ở local; trong Docker truyền bằng `build.args` |
| Island chưa hiện ngay sau khi reload | Astro hydrate sau sự kiện `load` | chờ thêm, không phải lỗi |

Xoá cache Vite, đúng thứ tự:

```bash
npx astro dev stop
rm -rf node_modules/.vite     # Windows: Remove-Item -Recurse -Force node_modules\.vite
npx astro dev --background
npx astro dev status
```

## Lưu ý

Số tài khoản thật vẫn còn trong commit `9e05ddc`. Repo đang private nên chỉ người có
quyền mới thấy lịch sử đó. Nếu sau này chuyển repo sang public thì phải viết lại lịch
sử (`git filter-repo`) rồi `push --force`, chứ xoá trong file thôi là không đủ.

## Chạy bằng Docker

Xem [docs/docker-local.md](docs/docker-local.md): `docker compose up -d --build` chạy Astro + Caddy, dữ liệu (`app.db`, `uploads`) trong volume `gc_data`.
