# Bỏ thanh toán VietQR — gửi đăng ký sang Google Sheets

**Ngày:** 2026-10-24
**Trạng thái:** chờ duyệt
**Loại:** breaking change — xoá toàn bộ phần thanh toán, thay bằng gửi dữ liệu

## 1. Ý định và lý do

Website Global Chess (trung tâm cờ vua trẻ 4–12 tuổi, 5 cơ sở TP.HCM) kết thúc form đăng
ký bằng một mã VietQR. Phụ huynh phải làm ba việc: điền form, quét mã để chuyển khoản, rồi
sao chép thông tin đăng ký và dán vào Zalo. Trung tâm không có danh sách nào để làm việc —
mọi thứ nằm rải rác trong tin nhắn Zalo và sao kê ngân hàng.

Sau thay đổi này, phụ huynh chỉ làm một việc: điền form và bấm gửi. Thông tin rơi thẳng vào
một Google Sheet. Quản lý trung tâm mở sheet mỗi ngày, lọc các dòng còn "Mới", rồi liên hệ
phụ huynh qua Zalo hoặc điện thoại. Học phí và việc đóng tiền được trao đổi trực tiếp sau
đó, ngoài website.

Hệ quả trực tiếp: website không còn nhận tiền, nên mọi thứ tồn tại để phục vụ chuyển khoản
đều bị xoá chứ không phải bị ẩn đi.

## 2. Mục tiêu

- Form đăng ký (nội dung, thứ tự trường, bố cục, giá tạm tính) **giữ nguyên như hiện tại**.
- Bấm gửi → dữ liệu vào sheet → phụ huynh thấy màn hình xác nhận.
- Quản lý đọc được trong sheet: gửi lúc nào, đã xử lý chưa, và mọi thứ cần để gọi lại.
- Không còn bất kỳ dấu vết nào của QR, số tài khoản, ngân hàng, nội dung chuyển khoản.
- Trang vẫn là static, vẫn deploy lên Vercel không cần server, không cần API key.

## 3. Không làm (non-goals)

- Không thanh toán online dưới mọi hình thức (không cổng, không QR, không chuyển khoản).
- Không gửi email/SMS xác nhận cho phụ huynh.
- Không làm trang quản trị. Google Sheet **là** giao diện quản trị.
- Không thêm adapter Vercel, không thêm serverless function, không thêm API key.
- Không đổi bảng học phí, không đổi `BRANCHES`, không đổi `TUITION_LEVELS`.
- Không đổi câu chữ của các trường trong form.

## 4. Anti-goals — những cách thất bại dù code chạy đúng

1. **Mất dữ liệu âm thầm.** Phụ huynh thấy "đã gửi" nhưng không có dòng nào trong sheet, và
   trung tâm không biết để gọi lại. Đây là kiểu hỏng tệ nhất, vì cả hai bên đều tin là xong.
2. **Rò dữ liệu trẻ em.** Sheet đang để "ai có link cũng xem". Nếu giữ nguyên khi có dữ liệu
   thật, tên và số điện thoại của trẻ em nằm trong tay bất kỳ ai có đường link.
3. **Trang pháp lý nói dối.** Hiện tại trang bảo mật cam kết không dữ liệu nào rời khỏi trình
   duyệt. Sau thay đổi, câu đó là sai sự thật nếu không sửa.
4. **Nút gửi bấm được nhiều lần.** Mạng chậm → phụ huynh bấm 3 lần → 3 dòng trùng trong sheet,
   quản lý gọi nhầm và tưởng có 3 đứa trẻ.
5. **Trẻ không điền được.** Phụ huynh điền xong, màn hình sau khi gửi trắng trơn, không có gì
   để chụp lại hay đối chiếu.

## 5. Ràng buộc

- Ngôn ngữ copy: tiếng Việt, giữ giọng hiện có trong `src/data/courses.ts`.
- Astro 7 static output, React 19 island, Tailwind 4. Không đổi stack.
- Node ≥ 22.12, test chạy bằng `node --test` (type-stripping đọc trực tiếp `.ts`).
- Giữ nguyên mọi comment hiện có, trừ comment mô tả đúng dòng bị thay đổi.
- `npm run check`, `npm test`, `npm run build` phải sạch trước khi bàn giao.
- Không sửa `INTERACTIVE_PUZZLE` (test phụ thuộc FEN).

## 6. Luồng phụ huynh trải qua

1. Bấm "Đăng ký ngay" ở một trong ba thẻ chương trình, hoặc "Chọn cơ sở này" ở phần cơ sở.
   Modal mở, form y như hiện tại, có sẵn chương trình/cơ sở tương ứng.
2. Điền form. Ô học phí tạm tính vẫn tự cập nhật theo chương trình, cấp độ, hình thức, số buổi.
3. Bấm nút gửi ở cuối form. Nhãn nút đổi từ **"Tạo mã VietQR"** thành **"Gửi đăng ký"**;
   số tiền bên phải nhãn giữ nguyên.
4. Ba kiểm tra, chạy theo thứ tự này: tên bé không được toàn khoảng trắng (**mới**, bản cũ
   chưa có), số điện thoại phải ≥ 10 chữ số sau khi bỏ ký tự không phải số (**nâng từ 9
   lên 10**; thông báo lỗi "ít nhất 9 chữ số" đổi thành 10), phải chọn ít nhất một khung
   giờ. Sai thì báo lỗi tại chỗ theo cách lỗi SĐT/khung giờ đang làm và **không gửi**. Lỗi tên
   bé dùng cùng kiểu hiển thị với lỗi SĐT (`aria-invalid`, `role="alert"`).
5. Nút chuyển sang trạng thái đang gửi: khoá, nhãn "Đang gửi…". Không cho bấm lại.
6. Thành công → màn hình xác nhận (mục 7.5), thay chỗ màn hình QR cũ.
7. Thất bại → khối lỗi ngay trong modal, giữ nguyên toàn bộ câu trả lời, có nút "Thử lại" và
   link Zalo trung tâm.

## 7. Cơ chế kỹ thuật

### 7.1. Vì sao phải có Apps Script

Một Google Sheet không nhận được POST. Không có URL nào của Sheets cho phép trình duyệt ghi
thêm dòng mà không kèm OAuth. Cách rẻ nhất và không cần khoá bí mật: một Google Apps Script
gắn vào chính sheet đó, publish thành web app.

- File mới trong repo: `google-apps-script/Code.gs`. Đây là **bản nguồn để đọc và dán**, không
  được build, không được import vào bundle.
- Chủ dự án dán vào `Extensions → Apps Script` của sheet, deploy `Web app`,
  `Execute as: Me`, `Who has access: Anyone`, rồi lấy URL kết thúc bằng `/exec`.
- URL đó khai vào biến môi trường `PUBLIC_GOOGLE_SHEETS_ENDPOINT`.
- Hướng dẫn từng bước cho người không quen Apps Script: `docs/google-sheets-setup.md`.

Hai điều dễ sai, phải ghi rõ trong hướng dẫn:

- Deploy lại sau **mỗi lần sửa script** và chọn **New version**, nếu không sheet vẫn chạy bản
  cũ. Đây là lỗi phổ biến nhất khiến "sửa code mà không thấy gì đổi".
- URL `/dev` chỉ chạy khi đã đăng nhập Google; URL dùng cho website phải là `/exec`.

### 7.2. Payload trình duyệt gửi đi

JSON, snake_case, ASCII. Không gửi `id`, không gửi thời gian do trình duyệt tính — giờ do
script sinh ra, vì đồng hồ máy phụ huynh có thể sai.

| Trường | Kiểu | Nguồn trong component |
| :--- | :--- | :--- |
| `child_name` | string | `childName` (trim) |
| `child_age` | string | `childAge` (trim) |
| `parent_name` | string | `parentName` (trim) |
| `phone` | string | `phone` đã bỏ hết ký tự không phải số |
| `branch` | string | `BRANCHES[i].name` (giữ nguyên tiền tố "Cơ sở ") |
| `branch_address` | string | `BRANCHES[i].address` |
| `program` | string | `TUITION_PROGRAMS[i].name` |
| `level_label` | string | nhãn cấp độ hiển thị cho phụ huynh, hoặc "Giáo viên xếp lớp sau ván thử" |
| `level_code` | string | `TUITION_LEVELS[i].code`, hoặc `"auto"` |
| `format_label` | string | `FORMAT_OPTIONS[i].label` |
| `format_code` | string | `FORMAT_CODE[i]` (`G12`, `G24`, `P11`, `P12`) |
| `sessions` | number | 12 hoặc 24 |
| `tuition_estimate` | number | `tuitionAmount`, đơn vị đồng, không định dạng |
| `time_slots` | string | `selectedSlots.join("; ")` |
| `note` | string | `note` (trim), có thể rỗng |
| `submission_id` | string | `crypto.randomUUID()`, sinh một lần cho mỗi lần gửi, xem 7.4 |
| `_hp` | string | bẫy spam, xem 7.4 |

Việc dựng payload phải nằm trong một hàm thuần, ví dụ `buildEnrolmentPayload(input)` ở
`src/lib/enrolment.ts`, để test được bằng `node --test` mà không cần render React.

### 7.3. Gửi từ trình duyệt

```ts
await fetch(ENDPOINT, {
  method: "POST",
  mode: "no-cors",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(10000),
});
```

- `text/plain` để không kích hoạt CORS preflight. Apps Script vẫn đọc được nguyên văn trong
  `e.postData.contents`.
- `no-cors` là bắt buộc: response của Apps Script không mang header CORS, nên `mode: "cors"`
  sẽ ném lỗi dù dòng đã được ghi.
- **Giới hạn phải nói thật:** với `no-cors`, trình duyệt trả về response rỗng (opaque) và
  không cho đọc nội dung. Vì vậy trang **không thể biết** dòng đã vào sheet hay chưa. `fetch`
  chỉ ném lỗi khi mất mạng hoặc quá 10 giây. Đây là lý do phải có `submission_id` (7.4): nếu
  lần gửi đầu kịp vào sheet rồi mới timeout, lần "Thử lại" sẽ không sinh dòng thứ hai.
- Không dùng `navigator.sendBeacon`: cùng độ mờ, lại khó báo lỗi cho người dùng.

### 7.4. `Code.gs`

Cấu trúc bắt buộc:

- Hằng số `SPREADSHEET_ID` ở đầu file, kèm comment chỉ rõ lấy từ đâu trong URL sheet. Không
  dùng `getActiveSpreadsheet()` để tránh phụ thuộc vào việc script có bound đúng hay không.
  Giá trị mặc định là ID của sheet test hiện tại
  (`1Zy_w09HQbZzotiUXPdZrRCMt0qgb-MuMuhYO83YqY-k`); chuyển sang sheet thật chỉ là sửa một dòng
  rồi deploy lại version mới.
- `doGet()` trả về chuỗi `ok` để chủ dự án dán URL vào trình duyệt kiểm tra deploy sống.
- `doPost(e)`:
  1. `JSON.parse(e.postData.contents)`; parse lỗi thì trả `{ok:false, error:"bad_json"}`.
  2. Nếu `_hp` khác rỗng → trả `{ok:true}` nhưng **không ghi gì** (bẫy spam, xem dưới).
  3. Thiếu `child_name`, `parent_name`, `phone` hoặc `submission_id` →
     `{ok:false, error:"missing_field"}`, không ghi.
  4. **Chống ghi trùng:** đọc trọn cột `Mã gửi`; nếu `submission_id` đã có thì trả `{ok:true}`
     và không ghi. Đây là thứ làm cho việc bấm "Thử lại" sau timeout an toàn.
  5. `LockService.getScriptLock().waitLock(5000)` bọc phần đọc-trùng và phần ghi, để hai phụ
     huynh gửi cùng lúc không ghi đè nhau và không cùng lọt qua bước 4.
  6. `setupSheet_()` nếu tab chưa có tiêu đề (lần chạy đầu).
  7. Ghi một dòng, thời gian do script sinh, định dạng `Asia/Ho_Chi_Minh`.
  8. Trả `{ok:true}`.
- `setupSheet_()`: tạo tiêu đề 18 cột, đóng băng dòng 1, đặt độ rộng cột, đặt định dạng số cho
  cột học phí, và gắn data validation danh sách cho cột trạng thái.
- Mọi ô chữ phải được ghi dưới dạng **text**, nếu không `0901234567` thành `901234567` (mất số
  0 đầu) và nội dung bắt đầu bằng `=` thành công thức. Cách làm: đặt `setNumberFormat('@')`
  cho vùng trước khi `setValues`, trừ cột học phí để định dạng `#,##0`.

Bẫy spam: một input ẩn trong form (`_hp`), người thật không bao giờ thấy và không điền. Nếu có
giá trị thì script im lặng bỏ qua. Không dùng CAPTCHA — thêm phụ thuộc bên thứ ba cho một form
đăng ký của trung tâm là không đáng.

### 7.5. Bố cục sheet

Tab tên `Đăng ký`, 18 cột theo đúng thứ tự:

| # | Cột | Nguồn |
| --: | :--- | :--- |
| 1 | Thời gian gửi | script, `yyyy-MM-dd HH:mm:ss`, giờ VN |
| 2 | Trạng thái | mặc định `Mới`, dropdown: `Mới` / `Đã liên hệ` / `Đã đăng ký` / `Huỷ` |
| 3 | Họ tên bé | `child_name` |
| 4 | Năm sinh / tuổi | `child_age` |
| 5 | Họ tên phụ huynh | `parent_name` |
| 6 | SĐT Zalo | `phone` |
| 7 | Cơ sở | `branch` |
| 8 | Địa chỉ cơ sở | `branch_address` |
| 9 | Chương trình | `program` |
| 10 | Cấp độ dự kiến | `level_label` |
| 11 | Mã cấp độ | `level_code` |
| 12 | Hình thức học | `format_label` |
| 13 | Mã hình thức | `format_code` |
| 14 | Số buổi | `sessions` |
| 15 | Học phí tạm tính (đ) | `tuition_estimate`, định dạng `#,##0` |
| 16 | Khung giờ | `time_slots` |
| 17 | Ghi chú | `note` |
| 18 | Mã gửi | `submission_id`, ẩn cột sau khi tạo |

Mã cấp độ và mã hình thức là hai cột thừa với người đọc, nhưng rẻ và giúp lọc/gộp sau này mà
không phải tách chuỗi tiếng Việt có dấu. Quản lý có thể ẩn cột nếu thấy rối. Cột `Mã gửi` do
script dùng để chống trùng, nên ẩn đi chứ đừng xoá.

### 7.6. Trạng thái trong modal

Component thay ba state QR (`showQR`, `qrLoaded`, `qrError`) và `qrAttempt` bằng một state
duy nhất kiểu `"form" | "sending" | "sent" | "error"`.

**Màn hình xác nhận** (thay toàn bộ màn hình QR):

- Tiêu đề hộp thoại đổi thành "Đã gửi đăng ký".
- Icon dấu tích xanh, dòng "Trung tâm đã nhận thông tin của bé {tên bé}."
- Dòng hứa: **"Trung tâm sẽ liên hệ sớm qua số {số điện thoại}."** Đúng chữ "sẽ liên hệ sớm",
  không nêu mốc thời gian cụ thể — trung tâm không cam kết được.
- Link Zalo trung tâm (`https://zalo.me/${BRAND_INFO.zaloPhone}`), nhãn "Nhắn Zalo trung tâm
  ngay", để dùng khi muốn hỏi thêm hoặc khi lần gửi không tới.
- Khối "Thông tin đăng ký" y như bản cũ **trừ dòng "Nội dung CK"**, để phụ huynh chụp lại.
  Học phí trong khối này ghi rõ là tạm tính.
- Nút "Đóng".

**Màn hình lỗi** (thay cho màn hình xác nhận khi fetch ném lỗi):

- "Chưa gửi được thông tin. Vui lòng kiểm tra kết nối mạng và thử lại."
- Nút "Thử lại" gửi lại **đúng payload cũ, giữ nguyên `submission_id`**. Nếu lần trước vẫn kịp
  vào sheet, script bỏ qua và không sinh dòng thứ hai.
- Link Zalo.
- Toàn bộ câu trả lời vẫn còn trong state để bấm thử lại.

### 7.7. Chống bấm trùng

- Nút bị `disabled` ngay khi vào trạng thái `sending`, chỉ mở lại khi `error`.
- `submission_id` sinh một lần khi rời trạng thái `form`, giữ nguyên qua các lần thử lại, và
  chỉ bỏ khi đã `sent`.
- Sau khi `sent`, form không còn đường quay lại trạng thái nhập. **Không** giữ nút
  "Sửa thông tin" của bản cũ: sửa rồi gửi lại sẽ đẻ ra dòng thứ hai, quản lý phải tự đoán dòng
  nào đúng. Nếu phụ huynh gõ sai, họ nhắn Zalo — màn hình xác nhận đã có sẵn link và số điện
  thoại để đối chiếu.

### 7.8. Mở lại hộp thoại sau khi đã gửi

Hộp thoại là một island duy nhất và state các trường sống ngoài vòng đời mở/đóng, nên nếu
không xử lý, đóng modal sau khi gửi rồi mở lại sẽ thấy form điền sẵn đúng dữ liệu vừa gửi —
bấm thêm một lần là thành dòng thứ hai.

Luật: **mở modal luôn đưa về form trắng**, cho cả hai đường vào (`handleOpenModal` từ thẻ
chương trình, và listener `gc:choose-branch`). Nghĩa là reset toàn bộ `childName`, `childAge`,
`parentName`, `phone`, `note`, `selectedSlots`, `privateSessions` về mặc định, và state gửi về
`"form"`.

Điều này chỉ áp dụng **lúc mở**, không áp dụng lúc đóng: phụ huynh lỡ tay đóng giữa lúc điền
rồi mở lại vẫn nên thấy cái mình vừa gõ. Muốn vậy thì không reset trong handler đóng modal,
chỉ reset trong hai handler mở.

Hệ quả chấp nhận: phụ huynh đóng modal giữa lúc điền rồi mở lại từ một thẻ chương trình khác
sẽ mất phần đã gõ. Đây là hành vi hiện tại với `selectedProgramId` và chấp nhận được; giữ một
bản nháp qua nhiều lần mở là việc của một thay đổi khác.

## 8. Bề mặt phải xoá hoặc sửa

Xoá hẳn:

- `src/data/payment.ts` (không còn ai import).
- Toàn bộ logic QR trong `PricingAndCheckout.tsx`: `qrUrl`, `retryQr`, `transferMemo`,
  `removeAccents`, `FORMAT_CODE` **chỉ nếu** không còn dùng cho payload (nếu payload vẫn cần
  `format_code` thì giữ), state `copied`/`copyFailed`, `copyToClipboard` và timer copy.
- Đoạn văn và nút "Sao chép thông tin đăng ký" / dán vào Zalo trong màn hình sau khi gửi.
- Bốn biến `PUBLIC_ACB_*` khỏi `astro.config.mjs`, `.env.example`, README, AGENTS.md, PRODUCT.md.

Sửa câu chữ:

- `PricingAndCheckout.tsx`: nhãn "Học phí cần thanh toán:" trong form → "Học phí tạm tính:".

- `src/data/courses.ts` dòng ~545 (FAQ "Đóng học phí bằng cách nào?"): tả lại luồng mới — điền
  form, trung tâm gọi lại, học phí trao đổi trực tiếp.
- `src/pages/index.astro` dòng ~162: nhãn "Đăng ký & Đóng học phí qua QR" → bỏ chữ QR.
- `src/pages/index.astro` dòng ~605: comment "Pricing & Dynamic VietQR Checkout".
- `DESIGN.md` dòng ~172: đoạn mô tả màn hình QR ở 375×667 không còn đúng.
- `README.md`: dòng mở đầu, mục Cấu trúc, bảng biến môi trường, checklist deploy, bảng xử lý
  sự cố.
- `AGENTS.md`: mục "Required environment" đang nói build báo lỗi vì thiếu `PUBLIC_ACB_*`.
- `PRODUCT.md`: hai đoạn mô tả luồng tạo mã VietQR.

Giữ nguyên (là bản ghi lịch sử, không sửa):

- `docs/superpowers/plans/2026-10-17-happy-chess-curriculum.md`.
- `.impeccable/critique/*.md`.

## 9. Nội dung pháp lý

Hai trang này hiện đang mô tả đúng hành vi cũ và sẽ thành sai sau thay đổi. Phải viết lại,
không chỉ xoá chữ "VietQR":

**`src/pages/chinh-sach-bao-mat.astro`** — thay đoạn "không có dữ liệu nào được gửi tới máy
chủ của trung tâm" bằng nội dung nêu rõ: thu những trường nào, gửi đi đâu (một Google Sheet
thuộc tài khoản Google của trung tâm, qua một Apps Script web app), để làm gì (liên hệ tư vấn
và xếp lớp), ai xem được, giữ bao lâu, và cách yêu cầu xoá (hotline/Zalo trong
`BRAND_INFO`). Bỏ toàn bộ đoạn về `img.vietqr.io` và đoạn "mã QR do bên thứ ba tạo".

**`src/pages/dieu-khoan-su-dung.astro`** — bỏ câu "chỗ học chỉ được giữ sau khi chuyển khoản".
Thay bằng: gửi form là đăng ký tư vấn, chỗ học chỉ được giữ sau khi trung tâm xác nhận trực
tiếp; học phí và hình thức đóng do hai bên trao đổi ngoài website.

Người viết không phải luật sư: copy phải là mô tả trung thực luồng dữ liệu, không thêm cam kết
pháp lý mới, và phải được chủ dự án đọc lại trước khi deploy.

## 10. Kiểm chứng

Tự động:

- `npm run check` — 0 lỗi.
- `npm test` — toàn bộ test cũ pass, cộng test mới `tests/enrolment.test.mjs` cho
  `buildEnrolmentPayload`: đủ trường, `phone` đã bỏ ký tự lạ, `time_slots` nối bằng `"; "`,
  `level_code` là `"auto"` khi chưa chọn cấp, `tuition_estimate` là number.
- `npm run build` — sạch. Build **phải báo lỗi** khi thiếu `PUBLIC_GOOGLE_SHEETS_ENDPOINT`,
  theo đúng quy ước sẵn có của dự án (thiếu biến là dừng build, để không deploy một form chết).

Thủ công, trên `astro dev`:

1. Điền form đầy đủ, bấm gửi → thấy màn hình xác nhận, mở sheet thấy đúng một dòng mới, đúng
   cột, số điện thoại còn số 0 đầu, cột học phí là số chứ không phải chuỗi.
2. Bấm gửi hai lần liên tiếp thật nhanh → chỉ một dòng.
3. Ngắt mạng (DevTools → Offline) rồi gửi → thấy khối lỗi, câu trả lời còn nguyên, bấm Thử lại
   sau khi bật mạng → một dòng.
4. **Trường hợp timeout nhưng dòng đã vào:** tạm hạ `AbortSignal.timeout` xuống 1ms, gửi một
   lần → trình duyệt báo lỗi, sheet đã có dòng; bấm Thử lại → vẫn đúng một dòng. Đây là bài
   kiểm tra thật cho `submission_id`; nhớ trả timeout về 10000.
5. Đóng modal sau khi gửi rồi mở lại từ thẻ chương trình → form trắng, không còn dữ liệu cũ;
   gửi lại từ đó thì có đúng một dòng mới.
6. Ô `_hp` do script điền giá trị → không có dòng mới nào.
7. Kiểm tra trên khổ 375×667: màn hình xác nhận không bị cắt, nút Đóng bấm được.

## 11. Việc của chủ dự án, không phải builder

1. Dán `google-apps-script/Code.gs` vào sheet, deploy web app, gửi lại URL `/exec`. Các bài
   kiểm tra thủ công ở mục 10 chỉ chạy được sau bước này, nên đây là việc phải làm trước khi
   coi thay đổi là hoàn tất — không phải việc dọn dẹp sau cùng.
2. Khai `PUBLIC_GOOGLE_SHEETS_ENDPOINT` trong `.env` local và trong Environment Variables của
   Vercel (cả Production và Preview).
3. **Siết quyền truy cập sheet** trước khi có dữ liệu thật: bỏ "ai có link cũng xem", chỉ để
   tài khoản quản lý và chủ sở hữu. Hiện sheet đang mở và đây là rủi ro riêng tư với dữ liệu
   trẻ em.
4. Đọc lại hai trang pháp lý sau khi viết lại.

## 12. Để builder tự quyết

- Câu chữ chính xác của màn hình xác nhận và màn hình lỗi, miễn giữ ý ở mục 7.6.
- Có hiện spinner hay chỉ đổi nhãn nút khi đang gửi.
- Độ rộng cột, màu tiêu đề, và chi tiết trình bày trong sheet.
- Cách viết hướng dẫn `docs/google-sheets-setup.md`, miễn có đủ hai cảnh báo ở mục 7.1.
- Có giữ `FORMAT_CODE`/`removeAccents` lại hay viết lại phần dựng payload gọn hơn.

## 13. Rủi ro đã chấp nhận

- **Không xác nhận được gửi thành công.** Hệ quả trực tiếp của `no-cors`. Giảm nhẹ bằng
  `submission_id` (thử lại không sinh dòng trùng), bằng link Zalo trên màn hình xác nhận, và
  bằng việc quản lý đọc sheet hằng ngày.
- **Endpoint công khai, ai đọc source cũng thấy.** Họ có thể spam sheet. Bẫy `_hp` chặn bot
  ngây thơ; không có cách chặn người cố tình mà không thêm backend. Chấp nhận, vì dữ liệu gửi
  vào vô hại và quản lý xoá dòng rác được.
- **Chrome/Brave chặn `no-cors` POST tới domain lạ.** Với `text/plain` thì request vẫn đi. Nếu
  thực tế bị chặn, đó là lúc phải tính tới một proxy serverless, và phải mở lại thiết kế này.
