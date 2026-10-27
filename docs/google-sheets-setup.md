# Cài Google Sheet nhận đăng ký

Form đăng ký trên website gửi thông tin tới một Google Apps Script; script ghi mỗi lần gửi
thành một dòng trong Google Sheet. Làm một lần theo các bước dưới. Không cần lập trình.

## 1. Dán script vào sheet

1. Mở Google Sheet sẽ nhận đăng ký.
2. Menu **Extensions → Apps Script**.
3. Xoá hết code mẫu, dán toàn bộ nội dung file `google-apps-script/Code.gs` trong repo.
4. Dòng `SPREADSHEET_ID` ở đầu file là ID của **sheet test**. Muốn ghi vào sheet khác, thay
   bằng ID của sheet đó: đoạn nằm giữa `/d/` và `/edit` trong URL của sheet.
5. Bấm **Save** (biểu tượng đĩa).

## 2. Deploy thành web app

1. Góc phải trên: **Deploy → New deployment**.
2. Bấm biểu tượng bánh răng cạnh "Select type", chọn **Web app**.
3. **Execute as: Me**. **Who has access: Anyone**.
4. Bấm **Deploy**, cấp quyền khi Google hỏi (lần đầu có cảnh báo "chưa xác minh": chọn
   *Advanced → Go to ... (unsafe)*, đây là script của chính bạn).
5. Sao chép **Web app URL**. Nó phải kết thúc bằng **`/exec`**.

Kiểm tra: dán URL đó vào trình duyệt. Thấy chữ `ok` là script đang sống.

> **Cảnh báo 1 — `/dev` không dùng được.** URL kết thúc bằng `/dev` chỉ chạy khi bạn đã đăng
> nhập Google. Website phải dùng URL `/exec`.
>
> **Cảnh báo 2 — sửa script xong phải deploy lại.** Sau MỖI lần sửa `Code.gs`: **Deploy →
> Manage deployments → bút chì (Edit) → Version: New version → Deploy**. Nếu không, web app
> vẫn chạy bản cũ và bạn sẽ tưởng code sửa không có tác dụng.

## 3. Khai URL cho website

- Local: trong file `.env`, đặt `PUBLIC_GOOGLE_SHEETS_ENDPOINT=<URL /exec>`.
- Vercel: **Project Settings → Environment Variables**, thêm `PUBLIC_GOOGLE_SHEETS_ENDPOINT`,
  chọn cả **Production** và **Preview**, rồi redeploy.

Thiếu biến này thì `npm run build` báo lỗi, để không deploy một form không gửi được đi đâu.

## 4. Siết quyền truy cập sheet trước khi có dữ liệu thật

Sheet chứa tên và số điện thoại của trẻ em. Trước khi nhận đăng ký thật: **Share → General
access → Restricted**, chỉ thêm tài khoản của quản lý và chủ sở hữu. Tuyệt đối không để
"Anyone with the link".

## 5. Cách dùng hằng ngày

Lần gửi đầu tiên script tự tạo tab **Đăng ký** với 14 cột. Mỗi dòng mới có Trạng thái là
`Mới`. Quản lý lọc cột Trạng thái, gọi lại phụ huynh, rồi đổi trạng thái (`Đã liên hệ`,
`Đã đăng ký`, `Huỷ`). Cột **Mã gửi** (cột N) bị ẩn: script dùng nó để không ghi trùng khi
phụ huynh bấm "Thử lại". Đừng xoá cột này.

**Đừng đổi tên tab `Đăng ký`.** Script tìm tab theo tên; đổi tên thì lần gửi kế tiếp tạo một tab
`Đăng ký` mới và các dòng mới nằm ở đó, còn lịch sử chống trùng ở tab cũ.

Tab **`Spam?`** (tự tạo khi có lần gửi dính bẫy chống spam) giữ lại những lần gửi bị bỏ qua. Thỉnh
thoảng mở xem: nếu có đăng ký thật bị trình duyệt tự điền nhầm ô ẩn, hãy gọi lại phụ huynh đó.

## Khi có sự cố

| Hiện tượng | Nguyên nhân thường gặp |
| :--- | :--- |
| Phụ huynh thấy "Đã gửi" nhưng sheet không có dòng | Chưa deploy lại sau khi sửa script; hoặc `PUBLIC_GOOGLE_SHEETS_ENDPOINT` trỏ vào URL `/dev`; hoặc `Who has access` chưa là `Anyone`. Website không đọc được phản hồi của Google nên không tự phát hiện được. |
| Mở URL `/exec` báo cần đăng nhập | `Who has access` đang không phải `Anyone`. |
| Số điện thoại mất số 0 đầu | Cột bị đổi định dạng thủ công thành số; đặt lại là *Plain text*. |
