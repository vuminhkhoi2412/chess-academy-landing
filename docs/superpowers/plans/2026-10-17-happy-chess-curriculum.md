# Bổ Sung Lộ Trình Happy Chess Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa lộ trình Happy Chess (72 buổi, 3 Level, tuổi 4–12) vào website, song song hai lộ trình Global Sơ cấp & Trung cấp đang có.

**Architecture:** `src/data/courses.ts` là nguồn dữ liệu duy nhất; `CURRICULUM_PROGRAMS` hiện có 2 phần tử khớp `MajorProgram`. Thêm phần tử thứ ba `happy-chess` (index 0, đúng thứ tự tài liệu chuẩn). `CurriculumExplorer.tsx` render `subLevels` bằng vòng lặp nên chỉ cần đổi lưới từ 2 sang 3 cột ở `lg`. Hero, nav, form đăng ký, FAQ và các trang phụ chỉ đổi copy cho khớp "3 lộ trình" và "4–12 tuổi".

**Tech Stack:** Astro 7, React 19 islands, Tailwind CSS 4, TypeScript, `node --test` (Node ≥ 22.12, type-stripping đọc trực tiếp `.ts`).

**Spec:** `docs/lo_trinh_hoc.md` (mục 1 — LỘ TRÌNH HAPPY CHESS).

## Global Constraints

- Ngôn ngữ copy: tiếng Việt, giữ giọng văn hiện có trong `src/data/courses.ts`.
- Happy Chess: **4 – 12 tuổi**, **72 buổi**, **3 Level × 24 buổi**.
- Global Sơ cấp & Trung cấp: **7 – 12 tuổi**, **48 buổi**, **2 cấp độ nhỏ × 24 buổi**.
- Mỗi buổi: **60 – 90 phút**.
- **Không đổi giá trị học phí** (`3600000`, `6500000`, `4800000`) và **không đổi cấu trúc `PRICING_PACKAGES`**. Chỉ ghi chú phần học phí chưa đối chiếu được (Task 7).
- **Không đổi tên/địa chỉ cơ sở** trong `BRANCHES` (giữ nguyên phần quận trong ngoặc: `(Q.6)`, `(Bình Tân)`, `(Tân Phú)`, `(Thủ Đức)`).
- Giữ nguyên mọi comment hiện có, trừ comment mô tả đúng dòng bị thay đổi.
- `npm run build` cần `.env` có `PUBLIC_ACB_ACCOUNT_NO` và `PUBLIC_ACB_ACCOUNT_NAME`. Nếu chưa có, copy từ `.env.example` trước khi build.
- Không sửa `INTERACTIVE_PUZZLE` (test `tests/puzzle.test.mjs` phụ thuộc FEN).

## Review Focus

Năm điểm dễ vỡ mà tài liệu chuẩn ngầm yêu cầu nhưng không có task nào tự kiểm:

1. **Bé 4–6 tuổi.** Sau khi thêm Happy Chess, mọi nhãn tuổi (hero, form, webmanifest, chính sách bảo mật, SEO) phải cho thấy `4–12`. Nếu còn sót `7–12`/`7 – 12` thì phụ huynh lớp 4 tuổi bị loại oan. → bước grep trong Task 6.
2. **Lưới 3 cấp độ.** `md:grid-cols-2` với 3 thẻ làm hàng 2 gãy thành 2 + 1 lệch. → bước đổi `lg:grid-cols-3` (Task 2) + kiểm tra build.
3. **Nav dài hơn.** Nhãn nav mới không được dài hơn `Lộ trình Sơ cấp & Trung cấp` để thanh nav `md:flex gap-8` không tràn. → ràng buộc độ dài trong Task 3.
4. **`subLevels` rỗng.** `CurriculumExplorer` gọi `.map` trực tiếp; dữ liệu rỗng làm island crash. → test "mỗi chương trình đều có bài học và kết quả" (Task 1).
5. **Copy tổng còn nói 48 buổi / 7–12.** Description SEO, structured data, FAQ, 404, webmanifest dễ bị bỏ sót. → bước grep + sửa (Task 3, 5, 6).

---

### Task 1: Dữ liệu Happy Chess + test

**Files:**
- Modify: `src/data/courses.ts` (thêm phần tử vào `CURRICULUM_PROGRAMS`, chèn trước phần tử `id: "so-cap"`)
- Test: `tests/curriculum.test.mjs` (tạo mới)

**Interfaces:**
- Consumes: interface `MajorProgram` / `SubLevel` đã có trong `src/data/courses.ts`.
- Produces: `CURRICULUM_PROGRAMS[0]` là `{ id: "happy-chess", ... }` với `subLevels` mã `HC1`, `HC2`, `HC3`; `totalDuration` chứa `72 buổi`; `targetAudience` chứa `4 – 12`.

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/curriculum.test.mjs`:

```js
// tests/curriculum.test.mjs
// Chạy: npm test   (node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM_PROGRAMS } from "../src/data/courses.ts";

const byId = (id) => CURRICULUM_PROGRAMS.find((p) => p.id === id);

test("có đủ 3 lộ trình lớn", () => {
  assert.equal(CURRICULUM_PROGRAMS.length, 3);
  assert.ok(byId("happy-chess"), "thiếu happy-chess");
  assert.ok(byId("so-cap"), "thiếu so-cap");
  assert.ok(byId("trung-cap"), "thiếu trung-cap");
});

test("Happy Chess: 72 buổi, 3 level × 24 buổi, tuổi 4–12", () => {
  const hc = byId("happy-chess");
  assert.match(hc.totalDuration, /72 buổi/);
  assert.match(hc.targetAudience, /4 – 12/);
  assert.equal(hc.subLevels.length, 3);
  assert.deepEqual(hc.subLevels.map((s) => s.code), ["HC1", "HC2", "HC3"]);
  for (const sub of hc.subLevels) {
    assert.equal(sub.duration, "24 buổi");
    assert.ok(sub.syllabus.length > 0, sub.code);
    assert.ok(sub.outcomes.length > 0, sub.code);
  }
});

test("Level 1 Happy Chess dạy 6 loại quân, nhập thành, phong cấp", () => {
  const topics = byId("happy-chess").subLevels[0].syllabus.map((s) => s.topic).join(" | ");
  assert.match(topics, /6 loại quân/);
  assert.match(topics, /Nhập thành/);
  assert.match(topics, /phong cấp/);
});

test("mỗi chương trình đều có bài học và kết quả", () => {
  for (const prog of CURRICULUM_PROGRAMS) {
    assert.ok(prog.objectives.length > 0, prog.id);
    assert.ok(prog.evaluation.length > 0, prog.id);
    for (const sub of prog.subLevels) {
      assert.ok(sub.syllabus.length > 0, sub.code);
      assert.ok(sub.outcomes.length > 0, sub.code);
      assert.ok(sub.duration.length > 0, sub.code);
    }
  }
});
```

- [ ] **Step 2: Chạy test để chắc chắn nó fail**

Run: `npm test`
Expected: FAIL — `có đủ 3 lộ trình lớn` báo `3 !== 2`, và `thiếu happy-chess`.

- [ ] **Step 3: Thêm dữ liệu Happy Chess vào `src/data/courses.ts`**

Chèn object sau vào `CURRICULUM_PROGRAMS` **ngay trước** phần tử `id: "so-cap"` (giữ dấu phẩy ngăn cách giữa hai phần tử):

```ts
  {
    id: "happy-chess",
    title: "Lộ Trình Happy Chess",
    badge: "4 – 12 tuổi • Nền tảng vững chắc",
    totalDuration: "72 buổi (3 Level – mỗi Level 24 buổi)",
    targetAudience: "Trẻ từ 4 – 12 tuổi (cả học viên mới và đã biết chơi)",
    sessionLength: "60 – 90 phút / buổi (điều chỉnh theo độ tuổi)",
    objectives: [
      "Nắm vững luật chơi và cách di chuyển 6 loại quân.",
      "Hiểu và áp dụng các chiến thuật cơ bản.",
      "Phát triển tư duy logic và khả năng tính toán.",
      "Tự tin thi đấu và xử lý các thế cờ thực tế.",
    ],
    evaluation: [
      "Level 1 (24 buổi): Chơi được ván cờ cơ bản, hiểu luật, biết chiếu bí, nhập thành và phong cấp.",
      "Level 2 (48 buổi): Có tư duy chiến thuật ban đầu, biết tìm nước đi có mục đích và áp dụng trong ván đấu.",
      "Level 3 (72 buổi): Vận dụng chiến thuật nâng cao, tự tin thi đấu và xử lý các thế cờ phức tạp.",
    ],
    subLevels: [
      {
        code: "HC1",
        name: "Level 1 – Happy Chess 1",
        duration: "24 buổi",
        lessonCount: "Làm quen và nắm vững luật chơi",
        goal: "Nhận biết và di chuyển 6 loại quân, nắm luật chơi cơ bản và biết cách chiếu bí.",
        syllabus: [
          { label: "Nội dung 1", topic: "Nhận biết và di chuyển 6 loại quân" },
          { label: "Nội dung 2", topic: "Luật chơi cơ bản, chiếu – chiếu bí" },
          { label: "Nội dung 3", topic: "Nhập thành, phong cấp, bắt tốt qua đường" },
          { label: "Nội dung 4", topic: "Ghi chép nước đi và thi đấu" },
        ],
        outcomes: [
          "Chơi được một ván cờ cơ bản.",
          "Hiểu luật và biết cách chiếu bí.",
          "Biết nhập thành và phong cấp.",
        ],
      },
      {
        code: "HC2",
        name: "Level 2 – Happy Chess 2",
        duration: "24 buổi",
        lessonCount: "Hoàn thiện kỹ năng cơ bản",
        goal: "Hoàn thiện kỹ năng cơ bản và hình thành tư duy chiến thuật ban đầu.",
        syllabus: [
          { label: "Nội dung 1", topic: "Ghi chép nước đi, thi đấu" },
          { label: "Nội dung 2", topic: "Chiếu bí với các quân (tốt, tượng, xe, hậu, mã)" },
          { label: "Nội dung 3", topic: "Khai cuộc cơ bản" },
          { label: "Nội dung 4", topic: "Phòng thủ 4 mã" },
          { label: "Nội dung 5", topic: "Phong cấp tốt" },
        ],
        outcomes: [
          "Có tư duy chiến thuật ban đầu.",
          "Biết tìm nước đi có mục đích.",
          "Áp dụng được trong ván đấu thực tế.",
        ],
      },
      {
        code: "HC3",
        name: "Level 3 – Happy Chess 3",
        duration: "24 buổi",
        lessonCount: "Phát triển chiến thuật và vận dụng",
        goal: "Phát triển chiến thuật và vận dụng vào các thế cờ phức tạp.",
        syllabus: [
          { label: "Nội dung 1", topic: "Chiếu bí với 2 xe, 1 hậu, 1 xe, 2 tượng" },
          { label: "Nội dung 2", topic: "Khai cuộc cơ bản và các biến thể" },
          { label: "Nội dung 3", topic: "Phòng thủ 4 mã" },
          { label: "Nội dung 4", topic: "Phong cấp tốt (nhiều thế cờ nâng cao)" },
          { label: "Nội dung 5", topic: "Thi đấu và kiểm tra cuối khóa" },
        ],
        outcomes: [
          "Vận dụng chiến thuật nâng cao.",
          "Tự tin thi đấu.",
          "Xử lý được các thế cờ phức tạp.",
        ],
      },
    ],
  },
```

- [ ] **Step 4: Chạy lại test để chắc chắn pass**

Run: `npm test`
Expected: PASS — cả 4 test mới và các test puzzle cũ đều xanh.

- [ ] **Step 5: Commit**

```bash
git add src/data/courses.ts tests/curriculum.test.mjs
git commit -m "feat: add Happy Chess curriculum program with tests"
```

---

### Task 2: `CurriculumExplorer` render 3 cấp độ

**Files:**
- Modify: `src/components/CurriculumExplorer.tsx:28-32, 103-104`

**Interfaces:**
- Consumes: `CURRICULUM_PROGRAMS` từ Task 1 (3 phần tử, mỗi phần tử 1–3 `subLevels`).
- Produces: không có API mới; chỉ đổi markup.

- [ ] **Step 1: Sửa tiêu đề và mô tả phụ cho đúng 4–12 tuổi và 3 lộ trình**

Thay `CurriculumExplorer.tsx:28`:

```tsx
            Lộ Trình Đào Tạo Global Chess (4 – 12 Tuổi)
```

Thay `CurriculumExplorer.tsx:30-32`:

```tsx
          <p className="text-slate-600 text-sm md:text-base mt-2">
            Happy Chess gồm 3 Level (72 buổi); Global Sơ cấp và Trung cấp mỗi lộ trình 48 buổi, chia thành các cấp độ nhỏ 24 buổi. Học viên nắm chắc từ luật chơi cơ bản đến các đòn chiến thuật trung – tàn cuộc nâng cao.
          </p>
```

- [ ] **Step 2: Sửa comment và lưới 2 cột thành 3 cột**

Thay `CurriculumExplorer.tsx:103`:

```tsx
        {/* Tầng 2: Chi tiết từng cấp độ nhỏ (24 buổi / cấp độ) */}
```

Thay `CurriculumExplorer.tsx:104` (dòng `<div className="grid md:grid-cols-2 gap-8 mb-14">`):

```tsx
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14">
```

- [ ] **Step 3: Kiểm tra lưới đã nhận 3 cột**

Run: `git grep -n "lg:grid-cols-3" -- src/components/CurriculumExplorer.tsx`
Expected: 1 kết quả ở dòng lưới tầng 2.

- [ ] **Step 4: Kiểm tra typecheck**

Run: `npm run check`
Expected: PASS, không lỗi TypeScript/Astro.

- [ ] **Step 5: Commit**

```bash
git add src/components/CurriculumExplorer.tsx
git commit -m "feat: render 3 sub-levels per curriculum track"
```

---

### Task 3: Hero, SEO, nav cho 3 lộ trình

**Files:**
- Modify: `src/pages/index.astro:32, 134, 146-147, 173`
- Modify: `src/components/SiteHeader.astro:19`

**Interfaces:**
- Consumes: không có (copy tĩnh).
- Produces: không có.

Ràng buộc: nhãn nav mới không dài hơn `Lộ trình Sơ cấp & Trung cấp` (30 ký tự) để không tràn thanh nav.

- [ ] **Step 1: Cập nhật nhãn nav**

Thay `SiteHeader.astro:19`:

```ts
  { href: "#curriculum", label: "Lộ trình Happy Chess & Global" },
```

- [ ] **Step 2: Cập nhật description SEO trang chủ**

Thay `index.astro:31-32`:

```ts
const pageDescription =
  "Trung tâm cờ vua Global Chess cho trẻ 4–12 tuổi tại TP.HCM: lộ trình Happy Chess 72 buổi và Global Sơ cấp & Trung cấp 48 buổi, lớp tối trong tuần và cuối tuần tại 5 cơ sở.";
```

- [ ] **Step 3: Cập nhật badge tuổi và đoạn mô tả hero**

Thay `index.astro:134` (dòng `Đào tạo Cờ Vua Trực Tiếp (7 – 12 tuổi) • 5 Cơ sở tại TP.HCM`):

```tsx
            Đào tạo Cờ Vua Trực Tiếp (4 – 12 tuổi) • 5 Cơ sở tại TP.HCM
```

Thay `index.astro:146-148` (thẻ `<p class="text-slate-600 text-base leading-relaxed max-w-xl">`):

```tsx
          <p class="text-slate-600 text-base leading-relaxed max-w-xl">
            Ba lộ trình chuẩn hóa <strong>Happy Chess (72 buổi)</strong> và <strong>Global Chess Sơ Cấp &amp; Trung Cấp (48 buổi)</strong> giúp trẻ đi từ luật chơi cơ bản đến làm chủ các hệ thống khai cuộc và đòn chiến thuật trung – tàn cuộc.
          </p>
```

- [ ] **Step 4: Cập nhật ô số liệu "Lộ trình chuẩn"**

Thay `index.astro:173` (dòng `<dd ...>48 Buổi</dd>`):

```tsx
              <dd class="text-xl md:text-2xl font-extrabold text-slate-900 tabular-nums whitespace-nowrap">48 – 72 Buổi</dd>
```

- [ ] **Step 5: Kiểm tra nhãn nav không dài hơn nhãn cũ**

Chạy PowerShell để đo độ dài nhãn nav mới:

```powershell
("Lộ trình Happy Chess & Global").Length
```

Expected: `30` hoặc nhỏ hơn (nhãn cũ `Lộ trình Sơ cấp & Trung cấp` cũng 30 ký tự, nên nav không tràn thêm).

- [ ] **Step 6: Kiểm tra còn sót copy cũ**

Run: `git grep -n "7 – 12\|7-12" -- src/pages/index.astro src/components/SiteHeader.astro`
Expected: không kết quả.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro src/components/SiteHeader.astro
git commit -m "feat: update hero, SEO and nav for Happy Chess track"
```

---

### Task 4: Form đăng ký nhận cấp độ Happy Chess

**Files:**
- Modify: `src/components/PricingAndCheckout.tsx:23-59, 420`

**Interfaces:**
- Consumes: mã cấp độ `HC1`/`HC2`/`HC3` từ Task 1 (để nội dung chuyển khoản khớp đăng ký thật).
- Produces: không có API mới.

Ràng buộc: `packageId` tạm gán `"hoc-phan-24"` (gói 24 buổi chung) — học phí Happy Chess chưa được xác nhận, ghi chú ở Task 7. Không đổi giá trị `PRICING_PACKAGES`.

- [ ] **Step 1: Thêm 3 lựa chọn cấp độ Happy Chess**

Trong `LEVEL_OPTIONS`, chèn 3 phần tử sau **ngay trước** phần tử `code: "SC1"`:

```ts
  {
    code: "HC1",
    label: "Happy Chess 1 (Level 1 - 24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "HC2",
    label: "Happy Chess 2 (Level 2 - 24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "HC3",
    label: "Happy Chess 3 (Level 3 - 24 buổi)",
    packageId: "hoc-phan-24",
  },
```

- [ ] **Step 2: Cập nhật nhãn tuổi của ô năm sinh**

Thay `PricingAndCheckout.tsx:420`:

```tsx
                      Năm sinh / Tuổi (4-12 tuổi) *
```

- [ ] **Step 3: Kiểm tra typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/PricingAndCheckout.tsx
git commit -m "feat: add Happy Chess levels to enrolment form"
```

---

### Task 5: FAQ khớp 3 lộ trình

**Files:**
- Modify: `src/data/courses.ts:307-340` (mảng `FAQS`)

**Interfaces:**
- Consumes: không có.
- Produces: không có.

- [ ] **Step 1: Cập nhật câu trả lời về độ tuổi**

Thay nội dung `a` của câu `q: "Bé mấy tuổi thì tham gia được?"`:

```ts
    a: "Global Chess nhận học viên từ 4 đến 12 tuổi. Lộ trình Happy Chess dành cho bé từ 4 tuổi; lộ trình Global Sơ cấp và Trung cấp dành cho bé từ 7 tuổi. Các bé được xếp theo trình độ thực tế chứ không chỉ theo tuổi.",
```

- [ ] **Step 2: Cập nhật câu trả lời về thời lượng lộ trình**

Thay nội dung `a` của câu `q: "Một lộ trình học kéo dài bao lâu?"`:

```ts
    a: "Happy Chess gồm 72 buổi (3 Level, mỗi Level 24 buổi). Lộ trình Global Sơ cấp và Trung cấp mỗi lộ trình gồm 48 buổi, chia thành 2 cấp độ nhỏ 24 buổi. Mỗi buổi kéo dài 60 – 90 phút.",
```

- [ ] **Step 3: Chạy test dữ liệu**

Run: `npm test`
Expected: PASS (không ảnh hưởng test nhưng xác nhận file còn hợp lệ).

- [ ] **Step 4: Commit**

```bash
git add src/data/courses.ts
git commit -m "docs: update FAQ for three curriculum tracks"
```

---

### Task 6: Copy còn lại (webmanifest, 404, chính sách, README)

**Files:**
- Modify: `public/site.webmanifest:2-4`
- Modify: `src/pages/404.astro:11, 33`
- Modify: `src/pages/chinh-sach-bao-mat.astro:69`
- Modify: `README.md:3, 81`

**Interfaces:**
- Consumes: không có.
- Produces: không có.

- [ ] **Step 1: Cập nhật webmanifest**

Thay `site.webmanifest:2` và `:4`:

```json
  "name": "Global Chess – Học cờ cho trẻ 4-12 tuổi",
```

```json
  "description": "Trung tâm cờ vua Global Chess tại TP.HCM: lộ trình Happy Chess 72 buổi và Global Sơ cấp & Trung cấp 48 buổi cho trẻ 4-12 tuổi, 5 cơ sở.",
```

- [ ] **Step 2: Cập nhật trang 404**

Thay `404.astro:11`:

```ts
  "Đường dẫn này không tồn tại. Quay về trang chủ Global Chess để xem lộ trình 48 – 72 buổi, 5 cơ sở tại TP.HCM và học phí.";
```

Thay `404.astro:33` (dòng `48 buổi, 5 cơ sở tại TP.HCM và học phí.`):

```tsx
          48 – 72 buổi, 5 cơ sở tại TP.HCM và học phí.
```

- [ ] **Step 3: Cập nhật chính sách bảo mật**

Thay `chinh-sach-bao-mat.astro:69`:

```tsx
            Học viên là trẻ 4–12 tuổi, nên mọi thông tin về bé đều do phụ huynh hoặc người giám hộ
```

- [ ] **Step 4: Cập nhật README**

Thay `README.md:3`:

```markdown
Trang giới thiệu trung tâm cờ vua Global Chess (trẻ 4 – 12 tuổi, 5 cơ sở tại TP.HCM).
```

Thay `README.md:81`:

```markdown
lộ trình Happy Chess 72 buổi & Global 48 buổi, 3 gói học phí, và thế cờ đố ở đầu trang.
```

- [ ] **Step 5: Grep xác nhận không còn nhãn tuổi cũ trong `src` và `public`**

Run: `git grep -n "7 – 12\|7-12" -- src public`
Expected: chỉ còn kết quả ở hai lộ trình Global trong `src/data/courses.ts` (`badge`/`targetAudience` của `so-cap` và `trung-cap`) và câu FAQ Global — không còn ở `index.astro`, `PricingAndCheckout.tsx`, `chinh-sach-bao-mat.astro`, `site.webmanifest`.

- [ ] **Step 6: Build toàn bộ**

Nếu chưa có `.env`: `Copy-Item .env.example .env` rồi điền `PUBLIC_ACB_ACCOUNT_NO` và `PUBLIC_ACB_ACCOUNT_NAME`.
Run: `npm run build`
Expected: build thành công, không lỗi env, sinh `dist/`.

- [ ] **Step 7: Commit**

```bash
git add public/site.webmanifest src/pages/404.astro src/pages/chinh-sach-bao-mat.astro README.md
git commit -m "docs: align remaining copy with four-to-twelve age range"
```

---

### Task 7: Ghi chú học phí + sửa lỗi lộ trình Trung cấp

**Files:**
- Modify: `docs/lo_trinh_hoc.md` (thêm mục ghi chú; sửa dòng "10 bài học" của phần Trung cấp)

**Interfaces:**
- Consumes: không có.
- Produces: không có.

- [ ] **Step 1: Thêm mục ghi chú học phí cuối tài liệu**

Thêm vào cuối `docs/lo_trinh_hoc.md` (sau phần "THÔNG TIN LIÊN HỆ ĐƠN VỊ ĐÀO TẠO"):

```markdown
---

## GHI CHÚ HỌC PHÍ (CẦN TRUNG TÂM XÁC NHẬN)

Tài liệu lộ trình này không nêu học phí. Website đang niêm yết ba mức sau, **chưa đối chiếu được với tài liệu chuẩn**:

- Khóa 24 buổi: 3.600.000đ
- Trọn gói 48 buổi: 6.500.000đ
- Kèm riêng 1-1 (12 buổi): 4.800.000đ

Cần bổ sung và xác nhận:
1. Học phí cho lộ trình Happy Chess (72 buổi, 3 Level × 24 buổi).
2. Học phí Happy Chess có theo mức 24 buổi chung hay có mức riêng cho bé 4–6 tuổi.
3. Danh mục "Lớp kèm riêng 1-1" có nằm trong lộ trình chuẩn hay là dịch vụ riêng.
```

- [ ] **Step 2: Sửa lỗi số bài học phần Trung cấp**

Trong `docs/lo_trinh_hoc.md`, mục "3. LỘ TRÌNH GLOBAL CHESS TRUNG CẤP", thay dòng:

```markdown
* **Thời lượng:** 48 buổi (2 quyển – 10 bài học).
```

thành:

```markdown
* **Thời lượng:** 48 buổi (2 quyển – 15 bài học).
```

(Quyển 1 có 5 bài + Quyển 2 có 10 bài = 15 bài; con số cũ "10 bài học" mâu thuẫn với danh sách bên dưới.)

- [ ] **Step 3: Xác nhận nội dung đã sửa**

Run: `git grep -n "10 bài học" -- docs/lo_trinh_hoc.md`
Expected: không kết quả ở dòng "Thời lượng" (dòng còn lại `Trung cấp Quyển 2 (10 bài học – 24 buổi)` là đúng, được phép còn).

- [ ] **Step 4: Commit**

```bash
git add docs/lo_trinh_hoc.md
git commit -m "docs: note unverified tuition and fix Trung cấp lesson count"
```
