# Đầu vào cho việc thiết kế lại site Global Chess

Điền file này rồi đưa cho Claude đọc trước khi lập kế hoạch. Chỗ nào chưa biết thì ghi "chưa biết", đừng bỏ trống, để người lập kế hoạch biết đó là câu hỏi còn mở.

Site mới thay landing page, hiện ngay ở trang chính, giống một cổng thông tin lớn của Global Chess. Tham khảo: https://www.royalchess.edu.vn/ và https://covuasaigon.edu.vn/.

## 1. Mục tiêu và người xem

Mục tiêu (3–5 dòng, xếp theo mức quan trọng):

1. Giới thiệu sơ qua về trung tâm, giới thiệu kỹ hơn về khoá học.
2. Đưa các bài đăng định kỳ, đưa các tin tức mới lên theo các sự kiện lớn nếu có. Các bài đăng nhiều loại nội dung như kiến thức, tuyển dụng nếu có.
3. Tất nhiên là cả các thông tin về từng cơ sở đồ các thứ, nói chung là toàn diện.

Người xem chính và họ cần gì khi vào site:

| Người xem | Họ cần tìm gì | Hành động mong muốn |
|---|---|---|
| Phụ huynh | Xem thông tin về trung tâm và khoá học, đọc các bài tin tức và kiến thức | Tìm được trung tâm gần với bản thân, để lại phương thức liên lạc và một số thông tin cơ bản để trung tâm liên lạc trong thời gian ngắn nhất |
| Học viên | Cái nào thì không nhiều đi, nếu là học viên lớn thì cơ bản giống như phụ huynh, còn học viên nhỏ thì thôi | Nếu được thì chỉ cần thấy thú vị đưa bố mẹ là được |
| Ứng viên tuyển dụng | Hiện tại có lẽ chưa cần, trung tâm đang đăng tuyển dụng trên kênh khác | Tạm thời chưa cần |

## 2. Kiểm kê nội dung

Cột "Có chưa": Đủ / Một phần / Chưa có. Cột "Đợt đầu": Có / Không.

| Mục | Có chưa | Ở đâu / ai giữ | Đợt đầu |
|---|---|---|---|
| Giới thiệu trung tâm | RỒI | Quản lý brand đang giữ | X |
| Khoá học (tên, độ tuổi, học phí, lịch) | RỒI | repo có trong assets/nguon| X |
| 5 cơ sở (địa chỉ, SĐT, bản đồ) | RỒI | Đọc file code, trong đó có hết rồi | X |
| Giáo viên / huấn luyện viên | Chỉ có tên| Quản lý trung tâm | |
| Tin tức, hoạt động | Chưa, khả năng tôi tự viết trước vài bài | Chưa có | |
| Kiến thức cờ vua | Tương tự như tin tức hoạt động | Chưa | |
| Tuyển dụng | Tạm thời không làm | Không làm | |
| Thành tích, giải đấu | Từng có, giờ thì không có| Kho lưu trữ| |
| Ảnh, video (đã có xác nhận của phụ huynh chưa) | RỒI| Trong repo đều đã được xác nhận cho phép dùng| X |
| Đăng ký học thử (form đang ẩn) | RỒI| Repo| X|
| Cửa hàng, kênh YouTube, mạng xã hội | RỒI| Trong repo, có kênh FB rồi| X|

## 3. Ghi chú về hai site tham khảo

Chụp ảnh từng phần và ghi chú. Gạch bỏ dòng không liên quan.

| Phần | Site | Thích | Không thích / muốn khác |
|---|---|---|---|
| Menu và cấu trúc trang | royalchess.edu.vn | | Menu thả xuống trình bày cực tệ |
| Menu và cấu trúc trang | covuasaigon.edu.vn | Menu thả xuống khi rê chuột | |
| Banner trượt + danh sách dịch vụ bên cạnh | covuasaigon.edu.vn | Banner lớn. Thanh trên cùng có 4 nút liên lạc và đăng nhập (Facebook, YouTube, bản đồ, tài khoản). Cách trình bày 6 quân cờ (`covuasaigon-six-pieces.png`) | Tương phản của 6 ô quân cờ tệ. Component trình bày hơi thô |
| Khối tin tức, hoạt động | royalchess.edu.vn | Bố cục bài đăng (`royalchess-posts.png`) tốt hơn covuasaigon, chia theo mục, tương phản khá tốt | Rìa trái của khối bài đăng lệch ra so với rìa trái của banner, và vài lỗi layout nhỏ khác |
| Cột mạng xã hội | covuasaigon.edu.vn | | Khung Facebook nhúng không cần |
| Màu sắc, cảm giác chung | royalchess.edu.vn | Palette đẹp và sang hơn covuasaigon | Màu vàng kim trên nền tím tương phản kém. Font chữ hơi vỡ |
| Chất lượng chung của site | covuasaigon.edu.vn | | Trang con lẫn tiếng Việt và tiếng Anh. Rất nhiều trang 404 và liên kết chết |

Ảnh tham khảo nằm ở `docs/redesign-refs/`: `covuasaigon-header-banner.png`, `covuasaigon-six-pieces.png`, `royalchess-header-banner.png`, `royalchess-posts.png`.

Mật độ thông tin muốn có: cấu trúc gần tương tự hai site trên nhưng thoáng, gọn và tương phản tốt hơn.

## 4. Nhân viên tự sửa được phần nào

Cột "Cách làm": Cố định trong code / Sửa được trong trang quản trị.
Cái nào sửa được trong trang quản trị thì thêm một phần việc, nhưng nhân viên không cần nhờ lập trình viên mỗi lần đổi.

| Phần | Mức độ đổi | Cách làm |
|---|---|---|
| Tin tức | Thường xuyên | Sửa được (đã có) |
| Banner trang chủ | Vài tuần | Cho phép sửa|
| Khoá học và học phí | Theo năm| Cho phép sửa|
| Thông tin cơ sở | Hầu như không đổi | Cần xác thực nếu muốn sửa |
| Giáo viên | Thường xuyên | Cho phép thay đổi. Sẽ cần ảnh cho từng người, hiện chưa có |
| Tuyển dụng | Không thường xuyên | Tạm không đăng tuyển dụng |
| Menu | Ít | Chỉ đổi bằng code|

## 5. Ràng buộc và thứ tự

- Việc chuyển hosting (bước 5 và 6) làm xong với site hiện tại trước. Bản thiết kế lại làm trên nhánh riêng, không merge vào `main` cho đến khi sẵn sàng.
- Giữ nguyên: tiếng Việt cho nội dung, URL tiếng Anh, 301 khi đổi URL cũ.
- Hạn mong muốn: không có.
- Điều khác cần biết: không có.
