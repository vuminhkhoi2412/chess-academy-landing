# Backlog

Việc đã chốt là sẽ làm nhưng chưa làm. Thứ tự dưới đây chưa phải thứ tự ưu tiên.

## Trình soạn bài (chắc chắn sẽ làm)

Trình soạn hiện có: tiêu đề 1–4, danh sách chấm/số/ô tích, đậm, nghiêng, gạch chân, màu chữ, liên kết, căn lề, tìm/thay. Bỏ qua tạm thời:

- **Chèn ảnh giữa bài.** Hiện ảnh chỉ ở đầu (ảnh bìa) và cuối bài. Cần giữ quy trình xác nhận phụ huynh đồng ý, xoá EXIF và thu nhỏ ảnh như ảnh đính kèm; thêm thẻ `img` vào danh sách lọc ở `src/server/rich-text.ts` chỉ cho đường dẫn `/uploads/...`.
- **Bảng.** Thêm thẻ `table`, `tr`, `td`, `th` vào bộ lọc; cần kiểu hiển thị cuộn ngang trên điện thoại.
- **Nhúng video** (YouTube...). Không cho `iframe` tự do; chỉ nhận một số tên miền và dựng iframe ở server từ địa chỉ đã kiểm tra, không lưu HTML iframe do người dùng gửi.
- **Chưa thêm (mẫu Tiptap có, chưa ai yêu cầu):** gạch ngang chữ, trích dẫn, tô nền chữ, chỉ số trên/dưới, mã. Thêm khi cần.

## Bài đăng

- Chia danh mục theo mục của trang (đã nói sẽ làm; hiện một danh sách chung).
- Hẹn giờ đăng.
- Tìm kiếm trong tin tức.
- Sửa chú thích ảnh (cột `caption` đã có nhưng chưa có ô nhập).

## Tài khoản

- Đăng nhập bằng Google (tuỳ chọn).
- Nhân viên tự đổi mật khẩu của mình (hiện chỉ Quản trị đặt lại giúp, hoặc dùng `npm run admin:reset`).

## Hạ tầng

- Sao lưu hằng ngày `gc_data` (bước 6; chọn homelab hay Google Drive).
- HSTS và header bảo mật chặt hơn sau khi HTTPS ổn định.
- Cập nhật `PRODUCT.md` (còn ghi "no blog, no server, no database") và `chinh-sach-bao-mat` cho việc đăng ảnh các bé.
