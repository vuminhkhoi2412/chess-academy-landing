# Chạy thử bằng Docker trên máy (bước 4)

Không cần VPS. Cần: Docker và Docker Compose. Chạy trong thư mục dự án.

```bash
cp .env.example .env        # điền PUBLIC_GOOGLE_SHEETS_ENDPOINT; để nguyên SITE_ADDRESS (mặc định :80)
docker compose up -d --build
docker compose ps           # app phải "healthy"
```

Tạo tài khoản quản trị đầu tiên (hỏi mật khẩu, không hiện lên màn hình):

```bash
docker compose exec app npm run admin:create -- ten.dang.nhap "Tên hiển thị"
```

Quên mật khẩu của quản trị duy nhất thì đặt lại (hỏi mật khẩu mới, tối thiểu 10 ký tự):

```bash
docker compose exec app npm run admin:reset -- ten.dang.nhap
```

Mở http://localhost:8080 (trang chủ) và http://localhost:8080/admin (quản trị).

## Việc cần thử trước khi mua VPS

1. Đăng nhập được ở `/admin` (không bị lỗi 403 "Cross-site POST").
2. Bật/tắt một tính năng, tải lại trang chủ thấy đổi ngay.
3. Viết một bài có ảnh, đăng, xem ở `/news`.
4. `docker compose restart app` rồi `docker compose down && docker compose up -d`: tài khoản, bài và ảnh vẫn còn.
5. `docker compose logs app` không có lỗi lặp lại.
6. Mở trang chủ lần đầu (ảnh chưa có trong bộ nhớ đệm) và lần hai; lần hai phải nhanh rõ rệt.

## Cách các phần nối với nhau

- Chỉ **Caddy** mở cổng ra ngoài (`HTTP_PORT`/`HTTPS_PORT`). Ứng dụng chỉ nhận request từ Caddy, vì thế mới an toàn khi đặt `TRUST_PROXY=1` (IP khách lấy từ `X-Forwarded-For`).
- Dữ liệu (`app.db`, thư mục `uploads`) nằm trong volume `gc_data`, giữ nguyên khi build lại. `docker compose down -v` **xoá** volume này, đừng dùng trừ khi muốn bỏ hết dữ liệu.
- `astro.config.mjs` → `security.allowedDomains` liệt kê tên miền được tin. Chạy trên tên miền khác thì sửa ở đó và build lại, nếu không mọi form POST bị 403.
- Chạy thật: đặt `SITE_ADDRESS=globalchess.edu.vn`, `HTTP_PORT=80`, `HTTPS_PORT=443`, trỏ DNS về máy chủ, Caddy tự xin chứng chỉ HTTPS.
- Giới hạn ảnh: `/_image` tối đa 60 lượt xử lý mới mỗi phút mỗi IP (ảnh đã nhớ không bị tính) và chiều rộng tối đa 2560; chỉnh ở `IMAGE_LIMIT_POLICY` trong `src/server/policy.ts`.

## Chưa làm ở bước này

- Sao lưu hằng ngày `gc_data` (bước 6; còn chờ chọn homelab hay Google Drive).
- HSTS và các header bảo mật chặt hơn: nên bật sau khi HTTPS ổn định trên tên miền thật.
