# Thông số chỉnh được của nền tảng quản trị

Các giá trị dưới đây đang là **mặc định tạm**, chọn để làm tiếp; chủ trung tâm chưa chốt. Muốn đổi chỉ cần sửa đúng chỗ ghi ở cột "Ở đâu".

## Bảo mật đăng nhập (`src/server/policy.ts`, `AUTH_POLICY`)

| Thông số | Hiện tại | Ý nghĩa |
|---|---|---|
| `sessionHours` | 12 | Đăng nhập một lần dùng được bao lâu |
| `maxFailuresPerUsername` | 5 | Sai mật khẩu bao nhiêu lần thì khoá tên đó |
| `maxFailuresPerIp` | 20 | Sai bao nhiêu lần từ một địa chỉ IP thì khoá IP đó |
| `lockoutMinutes` | 15 | Thời gian khoá |
| `minPasswordLength` | 10 | Độ dài mật khẩu tối thiểu |

## Trang chủ (`src/server/policy.ts`, `SITE_POLICY`)

| Thông số | Hiện tại | Ý nghĩa |
|---|---|---|
| `bannerMaxLength` | 160 | Số ký tự tối đa của dòng thông báo |

## Bộ nhớ đệm ảnh (`IMAGE_CACHE_POLICY`)

| Thông số | Hiện tại | Ý nghĩa |
|---|---|---|
| `maxEntries` | 400 | Số ảnh nhớ tối đa |
| `maxTotalBytes` | 64 MB | Tổng RAM dành cho ảnh. Tăng nếu VPS còn nhiều RAM |
| `maxEntryBytes` | 3 MB | Ảnh lớn hơn mức này không được nhớ |

Quyết định đi kèm: bộ nhớ đệm nằm trong RAM, mất khi khởi động lại. Chưa có giới hạn số lần gọi `/_image` với kích thước tuỳ ý; sẽ chặn bằng giới hạn tốc độ ở Caddy (bước 4).

## Các nút bật/tắt (`src/server/flags.ts`, `FLAG_DEFS`)

| Khoá | Mặc định | Khi tắt |
|---|---|---|
| `banner` | tắt | Ẩn dải thông báo; chỉ hiện khi bật **và** có nội dung |
| `puzzle` | bật | Bỏ bàn cờ ở đầu trang |
| `testimonials` | bật | Ẩn mục nhận xét **và** lời trích + ảnh các bé ở đầu trang |
| `gallery` | bật | Ẩn mục ảnh (không xử lý ảnh nữa) |
| `faq` | bật | Ẩn mục hỏi đáp và liên kết ở chân trang |
| `mobile_bar` | bật | Bỏ thanh Gọi/Zalo cố định trên điện thoại |
| `enrolment` | bật | Ẩn form, nút "Đăng ký ngay", "Chọn cơ sở này"; nút đầu trang đổi thành "Xem học phí" |

Các quyết định cần chủ trung tâm xác nhận:

- Tắt `enrolment` phải qua màn hình xác nhận (`CONFIRM_BEFORE_OFF`); muốn thêm mục nào cũng cần xác nhận thì thêm khoá vào danh sách đó.
- Chỉ quyền **Quản trị** vào được trang bật/tắt; **Biên tập** chỉ đăng bài (khi có).
- Lỗi đọc cơ sở dữ liệu: trang chủ dùng giá trị mặc định ở bảng trên và ghi lỗi ra log, không báo lỗi cho phụ huynh.
- Các trang tĩnh (404, trang chính sách) không biết trạng thái nút bật/tắt: thanh Gọi/Zalo trên trang 404 luôn hiện.

## Bài đăng (`src/server/policy.ts`, `POSTS_POLICY`)

| Thông số | Hiện tại | Ý nghĩa |
|---|---|---|
| `titleMax` / `summaryMax` / `bodyMax` | 120 / 200 / 20.000 | Số ký tự tối đa của tiêu đề, tóm tắt, nội dung (chỉ tính chữ) |
| `maxImages` | 8 | Số ảnh tối đa mỗi bài; ảnh đầu là ảnh bìa |
| `maxUploadBytes` | 8 MB | Dung lượng tối đa mỗi ảnh tải lên |
| `imageMaxWidth` / `imageQuality` | 1600 px / 80 | Ảnh tải lên được thu nhỏ và đổi sang webp theo mức này |
| `perPage` | 12 | Số bài mỗi trang ở `/news` |

Quyết định đã làm, chờ chủ trung tâm xác nhận:

- Nội dung bài soạn bằng trình soạn dạng Word, thanh nút biểu tượng (`src/components/admin/RichEditor.tsx`, React + Tiptap): hoàn tác/làm lại, tiêu đề 1–4 (menu thả xuống), danh sách chấm/đánh số/có ô tích, đậm, nghiêng, gạch chân, màu chữ, liên kết, căn trái/giữa/phải/đều, tìm và thay thế (không phân biệt hoa thường và dấu). Chèn ảnh giữa bài, bảng, nhúng video chưa có (xem `docs/backlog.md`). Ảnh nằm ở đầu (bìa) và cuối bài.
- Màu chữ: 6 màu chọn nhanh ở `src/data/editor-palette.ts` (đen, xanh đậm, xanh dương, vàng hổ phách, đỏ, xám) và có màu tự do. Ô cầu vồng mở bảng chọn màu tự do; ô gạch chéo bỏ màu. Muốn bỏ màu tự do thì xoá ô cầu vồng trong `RichEditor.tsx`.
- Bài lưu dưới dạng HTML và **luôn được lọc ở server** (`src/server/rich-text.ts`): chỉ giữ các thẻ `p, h1–h4, br, strong, em, u, a, span (chỉ color), ul, ol, li` và danh sách ô tích (`ul[data-type=taskList]` với ô tích bị khoá), `text-align` trên đoạn/tiêu đề (left, center, right, justify); link chỉ nhận http, https, mailto, tel và link ngoài tự mở tab mới. Đoạn trống bị bỏ. `h5`, `h6` dán từ nơi khác bị bỏ thẻ, giữ chữ. Lưu ý: bài có thể có nhiều `h1`; nên dùng Tiêu đề 2–4 cho mục trong bài vì tiêu đề bài đã là `h1` của trang.
- Giới hạn nội dung tính theo **chữ** (`bodyMax` 20.000 ký tự, không tính thẻ), kèm trần dung lượng HTML `bodyHtmlMax` 200.000 ký tự. Bài cũ dạng văn bản thuần vẫn hiển thị đúng và chuyển sang HTML khi sửa lần đầu.
- Màu chữ tiếp tục ở dòng kế khi bấm Enter (giống Word); muốn về màu mặc định thì bôi đen và bấm "Bỏ màu".
- Bài có ảnh chỉ đăng được khi người đăng tích "đã được phụ huynh đồng ý cho đăng ảnh các bé"; nhật ký ghi lại xác nhận này. Cần rà lại `privacy-policy.astro` cho khớp việc đăng ảnh các bé.
- Mọi nhân viên (Biên tập và Quản trị) soạn, đăng, gỡ bài được; **chỉ Quản trị xoá bài**.
- Đường dẫn bài (slug) tạo từ tiêu đề lúc lưu lần đầu và **không đổi** khi sửa tiêu đề.
- Ảnh được xoá thông tin EXIF (gồm vị trí GPS) và đặt tên ngẫu nhiên; lưu ở `DATA_DIR/uploads`, nên **thư mục này phải nằm trong sao lưu cùng `app.db`**.
- Mục "Tin tức" ở menu/chân trang chỉ hiện khi có ít nhất một bài đã đăng, và chỉ ở trang chủ và trang tin; các trang tĩnh khác (điều khoản, 404) không có liên kết này.
- Chưa có: hẹn giờ đăng, danh mục theo mục, tìm kiếm, bình luận.

## Triển khai (bước 4–5)

- `DATA_DIR`: thư mục chứa `app.db`, mặc định `./data`. Trên VPS đặt ra ổ/volume được sao lưu.
- `TRUST_PROXY=1`: bật khi chạy sau Caddy để lấy đúng IP khách (lấy phần tử **cuối** của `X-Forwarded-For`).
- `security.allowedDomains` trong `astro.config.mjs`: phải khai tên miền thật, nếu không Astro từ chối mọi form POST sau proxy (lỗi 403).
- `IMAGE_LIMIT_POLICY` (`policy.ts`): 60 lượt xử lý ảnh mới mỗi phút mỗi IP, chiều rộng tối đa 2560. Nhiều phụ huynh dùng chung một mạng (wifi trường) cùng mở trang chủ lúc chưa có ảnh trong bộ nhớ đệm có thể chạm mức này; nếu gặp thì tăng.
- Caddy: giới hạn một request 70 MB (`Caddyfile`), tương ứng 8 ảnh x 8 MB.
- Chưa bật HSTS; bật sau khi HTTPS ổn định.

## Chưa quyết định

- Nơi sao lưu hằng ngày: homelab hay Google Drive.
- Bài đăng chia danh mục theo mục trang sau; hiện dùng một danh sách chung.
- Đăng nhập bằng Google (tuỳ chọn, làm sau nếu cần).
- Năm giá trị `AUTH_POLICY` ở trên.
