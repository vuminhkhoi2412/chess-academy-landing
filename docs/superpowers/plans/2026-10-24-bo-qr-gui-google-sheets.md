# Bỏ QR thanh toán — gửi đăng ký sang Google Sheets: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Form đăng ký không còn tạo mã VietQR; bấm gửi thì POST dữ liệu tới một Google Apps Script ghi vào Google Sheet, và phụ huynh thấy màn hình xác nhận "trung tâm sẽ liên hệ sớm".

**Architecture:** Phần dựng/kiểm tra/gửi payload là module thuần `src/lib/enrolment.ts` (test bằng `node --test`). `google-apps-script/Code.gs` là bản nguồn để dán vào Apps Script, có phần thuần test được qua `node:vm`. `PricingAndCheckout.tsx` thay ba state QR bằng một state máy `"form" | "sending" | "sent" | "error"`. Mọi dấu vết QR/ngân hàng bị xoá, hai trang pháp lý được viết lại.

**Tech Stack:** Astro 7 static, React 19 island, Tailwind 4, Node ≥ 22.12 (`node --test` đọc thẳng `.ts`), Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-10-24-bo-qr-thanh-toan-gui-google-sheets-design.md` (đã duyệt). Executor đọc cả spec; plan chỉ ghi quyết định bổ sung.

## Global Constraints

- Copy tiếng Việt, giữ giọng hiện có trong `src/data/courses.ts`. Không đổi câu chữ nhãn các trường form.
- Không đổi `BRANCHES`, `TUITION_LEVELS`, bảng học phí, `INTERACTIVE_PUZZLE`.
- Không thêm adapter Vercel, serverless function, API key, CAPTCHA, dependency mới.
- Giữ mọi comment hiện có, trừ comment mô tả đúng dòng bị đổi.
- SĐT hợp lệ khi ≥ **10** chữ số sau khi bỏ ký tự không phải số; tên bé không được toàn khoảng trắng; ≥ 1 khung giờ. Thứ tự kiểm tra: tên → SĐT → khung giờ.
- Fetch: `POST`, `mode: "no-cors"`, `Content-Type: text/plain;charset=utf-8`, `AbortSignal.timeout(10000)`.
- Biến môi trường duy nhất: `PUBLIC_GOOGLE_SHEETS_ENDPOINT` (bắt buộc, không default; thiếu thì `npm run build` đỗ).
- Sheet: tab `Đăng ký`, **18** cột đúng thứ tự mục 7.5 của spec; `SPREADSHEET_ID` mặc định `1Zy_w09HQbZzotiUXPdZrRCMt0qgb-MuMuhYO83YqY-k`.
- Màn hình xác nhận dùng đúng cụm "sẽ liên hệ sớm", không nêu mốc thời gian.
- Không giữ nút "Sửa thông tin" sau khi `sent`.
- `npm run check`, `npm test`, `npm run build` phải sạch ở cuối (build cần `.env` có endpoint).
- `src/data/courses.ts` đang có thay đổi **staged của người dùng** (đổi `hotlines` bỏ dấu chấm). Không gộp nó vào commit của plan này: trước Task 4 chạy `git diff --cached`, hỏi người dùng muốn commit riêng hay để nguyên, rồi dùng `git add -p` chỉ lấy hunk FAQ.

## Review Focus

1. SĐT dạng `+84 901.234.567` hoặc có khoảng trắng/dấu chấm → payload chỉ chứa chữ số; < 10 chữ số bị chặn (Task 1, test `validateEnrolment`).
2. Ghi chú hoặc tên bắt đầu bằng `=`, `+`, `@` → sheet lưu dạng text, không thành công thức; SĐT giữ số 0 đầu (Task 2, test trên `buildRow_` + kiểm tra định dạng `@` trong thủ công).
3. Bấm gửi hai lần liên tiếp / "Thử lại" sau timeout → cùng `submission_id`, script bỏ qua bản trùng (Task 1 test giữ id; Task 2 test `isDuplicate_`).
4. Đóng modal khi đang `sending` rồi mở lại: kết quả của lần gửi cũ không được lật form trắng sang `sent` (Task 3, `attemptRef`).
5. Tên bé/ghi chú có dấu tiếng Việt, emoji hoặc dấu `"` → JSON hợp lệ, đọc lại nguyên vẹn (Task 1 test).

---

## File Structure

| File | Việc |
| :--- | :--- |
| `src/lib/enrolment.ts` (mới) | Kiểu dữ liệu, `validateEnrolment`, `buildEnrolmentPayload`, `postEnrolment`. Không import `astro:*` hay React. |
| `tests/enrolment.test.mjs` (mới) | Test cho ba hàm trên. |
| `google-apps-script/Code.gs` (mới) | `doGet`, `doPost`, `setupSheet_`, cộng hàm thuần `validate_`, `buildRow_`, `isDuplicate_`. Không build, không import. |
| `tests/apps-script.test.mjs` (mới) | Nạp `Code.gs` bằng `node:vm`, test hàm thuần. |
| `docs/google-sheets-setup.md` (mới) | Hướng dẫn deploy cho người không quen Apps Script. |
| `src/components/PricingAndCheckout.tsx` | Viết lại phần submit/QR. |
| `astro.config.mjs`, `.env.example`, `.env` | Đổi schema env. |
| `src/data/payment.ts` | Xoá. |
| `courses.ts`, `index.astro`, `404.astro`, hai trang pháp lý, `README.md`, `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md` | Sửa câu chữ. |

---

### Task 1: Module payload thuần `src/lib/enrolment.ts`

**Files:**
- Create: `src/lib/enrolment.ts`
- Test: `tests/enrolment.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export interface EnrolmentInput {
    childName: string; childAge: string; parentName: string; phone: string;
    branch: { name: string; address: string };
    program: string;                                   // TUITION_PROGRAMS[i].name
    level: { label: string; code: string } | null;     // null → "auto"
    format: { label: string; code: string };           // code: G12 | G24 | P11 | P12
    sessions: number; tuitionEstimate: number;
    timeSlots: string[]; note: string;
    submissionId: string; honeypot: string;
  }
  export type EnrolmentError = "name" | "phone" | "slots";
  export function validateEnrolment(i: Pick<EnrolmentInput, "childName" | "phone" | "timeSlots">): EnrolmentError | null;
  export function buildEnrolmentPayload(i: EnrolmentInput): Record<string, string | number>;  // 17 khoá snake_case của spec 7.2
  export async function postEnrolment(endpoint: string, payload: object): Promise<void>;       // ném khi mạng lỗi/timeout
  ```

- [ ] **Step 1: Viết test lỗi** trong `tests/enrolment.test.mjs` (import `../src/lib/enrolment.ts`, style như `tests/tuition.test.mjs`). Các test, với một `input` mẫu đầy đủ:
  - `validateEnrolment`: `"   "` → `"name"`; `"0901 234 56"` (9 số) → `"phone"`; `"+84 901.234.567"` → `null`; `timeSlots: []` → `"slots"`; tên rỗng **và** SĐT sai → `"name"` (thứ tự).
  - `buildEnrolmentPayload`: đủ 17 khoá của spec 7.2 (`child_name … submission_id, _hp`); `phone === "84901234567"` từ `"+84 901.234.567"`; `time_slots === "A; B"` từ `["A","B"]`; `level_code === "auto"` và `level_label === "Giáo viên xếp lớp sau ván thử"` khi `level: null`; `typeof tuition_estimate === "number"` và `typeof sessions === "number"`; chuỗi được `trim`; `JSON.parse(JSON.stringify(payload)).child_name` giữ nguyên `'Bé "An" 🙂 Nguyễn'`.
  - `postEnrolment`: thay `globalThis.fetch` bằng stub ghi lại đối số; assert `url`, `method === "POST"`, `mode === "no-cors"`, header `Content-Type === "text/plain;charset=utf-8"`, `body === JSON.stringify(payload)`, `signal instanceof AbortSignal`; stub ném lỗi → `postEnrolment` reject.
  - Giữ `submission_id`: gọi `buildEnrolmentPayload` hai lần với cùng `submissionId` → hai payload `deepEqual`.

- [ ] **Step 2: Chạy** `node --test tests/enrolment.test.mjs`. Expected: FAIL, không tìm thấy module.

- [ ] **Step 3: Cài đặt** `src/lib/enrolment.ts` theo Interfaces. `validateEnrolment` dùng `phone.replace(/[^0-9]/g, "").length < 10`. `postEnrolment` đúng như Global Constraints; không đọc response.

- [ ] **Step 4: Chạy lại** `node --test tests/enrolment.test.mjs`. Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add src/lib/enrolment.ts tests/enrolment.test.mjs
  git commit -m "feat: module dựng và gửi payload đăng ký"
  ```

---

### Task 2: Apps Script `Code.gs` và hướng dẫn deploy

**Files:**
- Create: `google-apps-script/Code.gs`, `tests/apps-script.test.mjs`, `docs/google-sheets-setup.md`

**Interfaces:**
- Produces (trong `Code.gs`, toàn cục):
  ```js
  const SPREADSHEET_ID = "1Zy_w09HQbZzotiUXPdZrRCMt0qgb-MuMuhYO83YqY-k"; // lấy từ URL sheet: /d/<ID>/edit
  const SHEET_NAME = "Đăng ký";
  function validate_(p)                 // → "ok" | "missing_field"   (thiếu child_name/parent_name/phone/submission_id)
  function isDuplicate_(ids, id)        // ids: mảng giá trị cột "Mã gửi" → boolean
  function buildRow_(p, timestamp)      // → mảng 18 phần tử đúng thứ tự spec 7.5; timestamp là chuỗi đã định dạng
  function doGet()                      // trả "ok"
  function doPost(e)                    // luồng 8 bước spec 7.4
  function setupSheet_(sheet)           // tiêu đề 18 cột, freeze, dropdown trạng thái, #,##0 cho cột 15, ẩn cột 18
  ```

- [ ] **Step 1: Viết test lỗi** `tests/apps-script.test.mjs`: đọc `google-apps-script/Code.gs`, chạy trong `vm.runInNewContext` với context rỗng (các hàm chỉ gọi `SpreadsheetApp` bên trong `doPost`/`setupSheet_`, nên khai báo hàm không cần global của Google). `const` ở top-level của script không lộ ra context, nên test lấy hàm bằng cách nối thêm `;({validate_, isDuplicate_, buildRow_})` vào cuối mã. Assert:
  - `validate_` trả `"missing_field"` khi thiếu từng trong bốn trường, `"ok"` khi đủ.
  - `isDuplicate_(["a","b"], "b") === true`, `isDuplicate_(["a"], "z") === false`, `isDuplicate_([], "z") === false`.
  - `buildRow_(payload, "2026-10-24 09:00:00")` có đúng 18 phần tử; `[0]` là timestamp, `[1] === "Mới"`, `[2] === child_name`, `[5] === "0901234567"` (chuỗi, còn số 0), `[14]` là number, `[17] === submission_id`.

- [ ] **Step 2: Chạy** `node --test tests/apps-script.test.mjs`. Expected: FAIL, không có file.

- [ ] **Step 3: Viết `Code.gs`** theo Interfaces và spec 7.4–7.5. `doPost`: parse JSON (lỗi → `{ok:false,error:"bad_json"}`), `_hp` khác rỗng → `{ok:true}` không ghi, `validate_`, rồi `LockService.getScriptLock().waitLock(5000)` bọc đọc cột `Mã gửi` + `isDuplicate_` + ghi (`setNumberFormat("@")` cho vùng chữ trước `setValues`, trừ cột 15). Thời gian bằng `Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "yyyy-MM-dd HH:mm:ss")`. Trả JSON bằng `ContentService`. Mở sheet bằng `openById(SPREADSHEET_ID)`, không dùng `getActiveSpreadsheet()`.

- [ ] **Step 4: Chạy lại** `node --test tests/apps-script.test.mjs`. Expected: PASS.

- [ ] **Step 5: Viết `docs/google-sheets-setup.md`**: từng bước dán script, đổi `SPREADSHEET_ID` nếu dùng sheet thật, deploy Web app (`Execute as: Me`, `Who has access: Anyone`), lấy URL `/exec`, kiểm tra bằng cách mở URL thấy `ok`, khai `PUBLIC_GOOGLE_SHEETS_ENDPOINT` ở `.env` và Vercel (Production + Preview). Phải có **hai cảnh báo** của spec 7.1 (deploy lại **New version** sau mỗi lần sửa; `/dev` ≠ `/exec`) và một mục "Siết quyền sheet trước khi có dữ liệu thật" (bỏ "ai có link cũng xem").

- [ ] **Step 6: Commit**
  ```bash
  git add google-apps-script tests/apps-script.test.mjs docs/google-sheets-setup.md
  git commit -m "feat: Apps Script ghi đăng ký vào Google Sheet kèm hướng dẫn deploy"
  ```

---

### Task 3: Component, env, xoá payment

**Files:**
- Modify: `src/components/PricingAndCheckout.tsx`, `astro.config.mjs`, `.env.example`, `.env` (gitignored, sửa tay)
- Delete: `src/data/payment.ts`

**Interfaces:**
- Consumes: `validateEnrolment`, `buildEnrolmentPayload`, `postEnrolment`, `EnrolmentInput` từ Task 1; `PUBLIC_GOOGLE_SHEETS_ENDPOINT` từ `astro:env/client`.
- Produces: không có API mới (island độc lập).

Các thay đổi trong component (đây là quyết định, phần thân do implementer viết):

- **Ghi chú:** form hiện **không có** ô ghi chú dù spec (7.2, 7.5, 7.8) có cột/trường `note`. Plan giữ nguyên form (non-goal "không đổi form") và component luôn gửi `note: ""`; cột "Ghi chú" trong sheet để trống. Chờ người dùng quyết định có thêm ô ghi chú hay không.
- State: xoá `showQR`, `qrLoaded`, `qrError`, `copied`, `copyFailed`, `copyTimer`, `copyToClipboard`, `qrUrl`, `removeAccents`, `transferMemo`, `cleanChildName`, import `BANK_CONFIG`, icon `Copy`/`ShieldCheck` nếu hết dùng. Thêm `submitState: "form" | "sending" | "sent" | "error"`, `nameError: boolean`, `honeypot: string`, `submissionIdRef`, `payloadRef`, `attemptRef` (số nguyên, tăng mỗi lần mở modal). Giữ `FORMAT_CODE` (payload cần).
- `resetForm()` đưa `childName`, `childAge`, `parentName`, `phone`, `selectedSlots` (= `[FLEXIBLE_TIME_SLOTS[1]]`), `privateSessions` (12), `honeypot`, các cờ lỗi về mặc định, `submitState = "form"`, xoá hai ref, `attemptRef.current++`. Gọi trong **cả hai** handler mở (`handleOpenModal`, listener `gc:choose-branch`), **không** gọi khi đóng.
- Submit handler `handleSubmit(e)`: `validateEnrolment`; lỗi `"name"` → `nameError`, `"phone"` → `phoneError`, `"slots"` → `slotError`, rồi return. Hợp lệ → `submitState = "sending"`, tạo `submissionIdRef.current ??= crypto.randomUUID()`, dựng `payloadRef.current` một lần, gọi `sendPayload()`.
- `sendPayload()`: ghi `const attempt = attemptRef.current`; `await postEnrolment(PUBLIC_GOOGLE_SHEETS_ENDPOINT, payloadRef.current)`; nếu `attempt !== attemptRef.current` thì bỏ qua kết quả; thành công → `"sent"`; catch → `"error"`. Nút "Thử lại" gọi lại `sendPayload()` (cùng payload, cùng `submission_id`).
- Nút gửi: nhãn "Gửi đăng ký" (giữ số tiền bên phải), `disabled` khi `sending`, nhãn "Đang gửi…" trong lúc gửi. Nhãn "Học phí cần thanh toán:" → "Học phí tạm tính:". Tiêu đề hộp thoại: `sent` → "Đã gửi đăng ký"; còn lại giữ "Đăng ký cơ sở & khung giờ học".
- Ô tên bé: thêm `aria-invalid`, `aria-describedby`, thông báo lỗi `role="alert"` cùng kiểu ô SĐT ("Vui lòng nhập họ tên của bé."); xoá lỗi khi gõ. Thông báo lỗi SĐT đổi "ít nhất 9" → "ít nhất 10 chữ số".
- Honeypot: `<input type="text" name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true">` đặt ngoài màn hình (`absolute -left-[9999px]`), ràng buộc `honeypot`. Vì `FOCUSABLE_SELECTOR` có `input:not([disabled])`, thêm điều kiện `el.tabIndex >= 0` vào bộ lọc trong `getFocusable()` để vòng Tab không rơi vào nó.
- Màn hình `sent` thay màn hình QR: icon `CheckCircle`, "Trung tâm đã nhận thông tin của bé {childName}.", "Trung tâm sẽ liên hệ sớm qua số {phone}.", link Zalo (`https://zalo.me/${BRAND_INFO.zaloPhone}`, nhãn "Nhắn Zalo trung tâm ngay"), khối "Thông tin đăng ký" như cũ trừ dòng "Nội dung CK" (dòng học phí ghi "Học phí tạm tính"), nút "Đóng" (`setIsModalOpen(false)`). Màn hình `error`: "Chưa gửi được thông tin. Vui lòng kiểm tra kết nối mạng và thử lại.", nút "Thử lại", link Zalo; form giữ nguyên state.
- `astro.config.mjs`: thay bốn `PUBLIC_ACB_*` bằng `PUBLIC_GOOGLE_SHEETS_ENDPOINT: envField.string({ context: 'client', access: 'public' })` (không default), viết lại comment phía trên cho đúng ("thiếu biến là build đỗ, để không deploy một form chết").
- `.env.example` và `.env`: chỉ còn `PUBLIC_GOOGLE_SHEETS_ENDPOINT=https://script.google.com/macros/s/REPLACE_ME/exec` cùng comment nói thiếu biến là build đỗ.

- [ ] **Step 1: Sửa `astro.config.mjs`, `.env.example`, `.env`** như trên.
- [ ] **Step 2: Sửa `PricingAndCheckout.tsx`** theo các gạch đầu dòng trên; xoá `src/data/payment.ts` (`git rm`).
- [ ] **Step 3: Kiểm tra tĩnh.** Run: `npm run check`. Expected: 0 errors. Run: `grep -rniE "BANK_CONFIG|vietqr|qrUrl|PUBLIC_ACB" src astro.config.mjs .env.example` → Expected: không có dòng nào (404.astro còn comment, sửa ở Task 4).
- [ ] **Step 4: Kiểm tra trên trình duyệt** (`astro dev --background`, xem CLAUDE.md; nếu sửa `astro.config.mjs` thì xoá `node_modules\.vite` rồi khởi động lại). Dùng endpoint giả để không phụ thuộc deploy của chủ dự án: tạm đặt `PUBLIC_GOOGLE_SHEETS_ENDPOINT=http://localhost:8787/` và chạy `node -e "require('http').createServer((q,s)=>{q.on('data',d=>console.log(String(d)));q.on('end',()=>s.end('ok'))}).listen(8787)"`. Kiểm: điền đủ → thấy màn hình xác nhận, server in đúng một JSON 17 khoá; bấm gửi đúp → một request; tên toàn dấu cách → lỗi tên, không request; SĐT 9 số → lỗi SĐT; DevTools Offline → khối lỗi, bật mạng bấm "Thử lại" → request cùng `submission_id`; đóng modal sau `sent` rồi mở lại từ thẻ chương trình và từ "Chọn cơ sở này" → form trắng; khổ 375×667 màn xác nhận không bị cắt, nút Đóng bấm được. Trả `.env` về placeholder sau khi xong.
- [ ] **Step 5: Commit**
  ```bash
  git add astro.config.mjs .env.example src/components/PricingAndCheckout.tsx
  git rm src/data/payment.ts
  git commit -m "feat!: bỏ VietQR, form đăng ký gửi sang Google Sheets"
  ```

---

### Task 4: Câu chữ, trang pháp lý, tài liệu

**Files:**
- Modify: `src/data/courses.ts:545`, `src/pages/index.astro:162,605`, `src/pages/404.astro:4`, `src/pages/chinh-sach-bao-mat.astro`, `src/pages/dieu-khoan-su-dung.astro`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md`, `DESIGN.md`

Quyết định nội dung (viết lại bằng tiếng Việt, giọng hiện có):

- FAQ "Đóng học phí bằng cách nào?": điền form đăng ký, trung tâm sẽ liên hệ lại, học phí và hình thức đóng trao đổi trực tiếp với trung tâm. Đổi nhãn nút trang chủ "Đăng ký & Đóng học phí qua QR" → "Đăng ký tư vấn" (bỏ chữ QR và "Đóng học phí"). Comment `index.astro:605` → "Pricing & Enrolment Form". Comment `404.astro:4` bỏ nhắc `payment`/biến ngân hàng (sửa thành không import `../data/courses` thứ gì cần env — chỉ xoá câu đó).
- `chinh-sach-bao-mat.astro`: mục 1 và 2 viết lại — thu những trường nào (liệt kê đủ trường form), gửi tới **một Google Sheet thuộc tài khoản Google của trung tâm, qua Apps Script web app**, mục đích liên hệ tư vấn và xếp lớp, chỉ quản lý trung tâm xem được, giữ cho tới khi hết nhu cầu liên hệ (không nêu số ngày cụ thể), muốn xoá thì gọi/nhắn Zalo theo `BRAND_INFO`. Xoá hết đoạn `img.vietqr.io`, "nội dung chuyển khoản", và câu "không có dữ liệu nào được gửi tới máy chủ". Giữ đoạn Zalo, đổi "nút báo Zalo" thành "link nhắn Zalo". Không thêm cam kết pháp lý mới.
- `dieu-khoan-su-dung.astro`: mục 2 đổi tên "Đăng ký và giữ chỗ": gửi form là đăng ký tư vấn, chỗ chỉ được giữ sau khi trung tâm xác nhận trực tiếp, học phí và hình thức đóng do hai bên trao đổi ngoài website. Mục 6 bỏ câu về quét QR/chuyển khoản.
- `README.md`: dòng mở đầu, cây thư mục (bỏ `payment.ts`, thêm `lib/enrolment.ts`, `google-apps-script/`), bảng biến môi trường (một biến), checklist deploy bước 2 (một biến + bước deploy Apps Script, trỏ `docs/google-sheets-setup.md`), bảng sự cố (đổi dòng `PUBLIC_ACB_ACCOUNT_NO is missing` → `PUBLIC_GOOGLE_SHEETS_ENDPOINT is missing`), dòng "Thông tin ngân hàng không nằm trong code", đoạn "Lưu ý PUBLIC_*" (nói endpoint công khai là chấp nhận được, có bẫy `_hp`).
- `AGENTS.md:21` và `CLAUDE.md` mục "Required environment": đổi sang `PUBLIC_GOOGLE_SHEETS_ENDPOINT`.
- `PRODUCT.md`: dòng 19–23, 38–40, 71–74 mô tả luồng mới (form → Google Sheet → trung tâm gọi lại; build đỗ khi thiếu endpoint để không deploy form chết; endpoint công khai trong bundle).
- `DESIGN.md`: dòng 84 (emerald dùng cho "payment success panel", "copy account number") → "màn hình xác nhận đã gửi", bỏ phần copy; dòng 159 ("blocking payment error") → "lỗi gửi đăng ký". Spec ghi dòng ~172 mô tả màn QR 375×667, nhưng `grep` không thấy; chạy `grep -niE "qr|payment|vietqr|chuyển khoản" DESIGN.md` và sửa mọi dòng còn khớp.

- [ ] **Step 1: Sửa các file trên.** Với `courses.ts`: xem Global Constraints về thay đổi staged của người dùng.
- [ ] **Step 2: Quét sót.** Run: `grep -rniE "vietqr|\bQR\b|PUBLIC_ACB|BANK_CONFIG|chuyển khoản|ngân hàng" src README.md AGENTS.md CLAUDE.md PRODUCT.md DESIGN.md .env.example astro.config.mjs`. Expected: không còn dòng nào (các file lịch sử `docs/superpowers/plans/2026-10-17-*` và `.impeccable/critique/*` được phép giữ).
- [ ] **Step 3: Chủ dự án đọc lại hai trang pháp lý** (xem spec mục 9). Dừng và chuyển nội dung hai trang cho người dùng trước khi coi task xong.
- [ ] **Step 4: Commit**
  ```bash
  git add src/pages README.md AGENTS.md CLAUDE.md PRODUCT.md DESIGN.md
  git add -p src/data/courses.ts
  git commit -m "docs: cập nhật câu chữ, trang pháp lý và tài liệu theo luồng gửi Google Sheets"
  ```

---

### Task 5: Kiểm chứng cuối

- [ ] **Step 1:** `npm run check` → 0 errors. `npm test` → toàn bộ pass (gồm `curriculum`, `puzzle`, `tuition`, `enrolment`, `apps-script`). `npm run build` → thành công với `.env` có endpoint.
- [ ] **Step 2:** Xoá tạm dòng endpoint khỏi `.env`, chạy `npm run build`. Expected: build **đỗ** với thông báo thiếu `PUBLIC_GOOGLE_SHEETS_ENDPOINT`. Khôi phục `.env`.
- [ ] **Step 3: Chờ chủ dự án** deploy `Code.gs` và gửi URL `/exec` (spec mục 11). Sau đó chạy 7 bài thủ công của spec mục 10 với URL thật, đặc biệt bài 4 (hạ `AbortSignal.timeout` xuống 1ms, nhớ trả về 10000) và bài 6 (`_hp` có giá trị → không có dòng). Nhắc người dùng siết quyền sheet và khai biến trên Vercel (Production + Preview).
