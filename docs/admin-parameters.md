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
| `titleMax` / `summaryMax` / `bodyMax` | 120 / 200 / 20.000 | Số ký tự tối đa của tiêu đề, tóm tắt, nội dung |
| `maxImages` | 8 | Số ảnh tối đa mỗi bài; ảnh đầu là ảnh bìa |
| `maxUploadBytes` | 8 MB | Dung lượng tối đa mỗi ảnh tải lên |
| `imageMaxWidth` / `imageQuality` | 1600 px / 80 | Ảnh tải lên được thu nhỏ và đổi sang webp theo mức này |
| `perPage` | 12 | Số bài mỗi trang ở `/tin-tuc` |

Quyết định đã làm, chờ chủ trung tâm xác nhận:

- Nội dung bài là **văn bản thuần** (dòng trống = đoạn mới, nút "+ Thêm tiêu đề mục"), không in đậm/chèn link/chèn ảnh giữa bài. Ảnh nằm ở đầu (bìa) và cuối bài. Muốn trình soạn thảo đầy đủ thì làm thêm ở bước sau.
- Bài có ảnh chỉ đăng được khi người đăng tích "đã được phụ huynh đồng ý cho đăng ảnh các bé"; nhật ký ghi lại xác nhận này. Cần rà lại `chinh-sach-bao-mat.astro` cho khớp việc đăng ảnh các bé.
- Mọi nhân viên (Biên tập và Quản trị) soạn, đăng, gỡ bài được; **chỉ Quản trị xoá bài**.
- Đường dẫn bài (slug) tạo từ tiêu đề lúc lưu lần đầu và **không đổi** khi sửa tiêu đề.
- Ảnh được xoá thông tin EXIF (gồm vị trí GPS) và đặt tên ngẫu nhiên; lưu ở `DATA_DIR/uploads`, nên **thư mục này phải nằm trong sao lưu cùng `app.db`**.
- Mục "Tin tức" ở menu/chân trang chỉ hiện khi có ít nhất một bài đã đăng, và chỉ ở trang chủ và trang tin; các trang tĩnh khác (điều khoản, 404) không có liên kết này.
- Chưa có: hẹn giờ đăng, danh mục theo mục, tìm kiếm, bình luận.

## Triển khai (bước 4–5)

- `DATA_DIR`: thư mục chứa `app.db`, mặc định `./data`. Trên VPS đặt ra ổ/volume được sao lưu.
- `TRUST_PROXY=1`: bật khi chạy sau Caddy để lấy đúng IP khách (lấy phần tử **cuối** của `X-Forwarded-For`).
- `security.allowedDomains` trong `astro.config.mjs`: phải khai tên miền thật, nếu không Astro từ chối mọi form POST sau proxy (lỗi 403).

## Chưa quyết định

- Nơi sao lưu hằng ngày: homelab hay Google Drive.
- Bài đăng chia danh mục theo mục trang sau; hiện dùng một danh sách chung.
- Đăng nhập bằng Google (tuỳ chọn, làm sau nếu cần).
- Năm giá trị `AUTH_POLICY` ở trên.
