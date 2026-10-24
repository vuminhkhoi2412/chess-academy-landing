// tests/apps-script.test.mjs
// Chạy: npm test   (node --test)
//
// `google-apps-script/Code.gs` không được build; nó được dán vào Apps Script. Test này nạp
// nguyên văn file trong vm và chỉ thử các hàm thuần (không đụng SpreadsheetApp).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../google-apps-script/Code.gs", import.meta.url), "utf8");
const { validate_, isDuplicate_, buildRow_, LOCK_WAIT_MS } = vm.runInNewContext(
  `${source}\n;({ validate_, isDuplicate_, buildRow_, LOCK_WAIT_MS })`
);

const payload = () => ({
  child_name: "Nguyễn Minh An",
  child_age: "2016",
  parent_name: "Chị Thảo",
  phone: "0901234567",
  branch: "Cơ sở Quận 1",
  branch_address: "1 Lê Lợi",
  program: "Sơ cấp",
  level_label: "Sơ cấp 1",
  level_code: "SC1",
  format_label: "Lớp group — 24 buổi",
  format_code: "G24",
  sessions: 24,
  tuition_estimate: 3600000,
  time_slots: "Tối T2–T6; Sáng T7",
  note: "=HYPERLINK(\"x\")",
  submission_id: "abc-123",
  _hp: "",
});

test("validate_: đủ bốn trường bắt buộc thì ok", () => {
  assert.equal(validate_(payload()), "ok");
});

for (const field of ["child_name", "parent_name", "phone", "submission_id"]) {
  test(`validate_: thiếu ${field} thì missing_field`, () => {
    const p = payload();
    p[field] = "";
    assert.equal(validate_(p), "missing_field");
  });
}

test("isDuplicate_: tìm thấy mã gửi cũ", () => {
  assert.equal(isDuplicate_(["a", "b"], "b"), true);
});

test("isDuplicate_: mã mới hoặc cột rỗng không phải bản trùng", () => {
  assert.equal(isDuplicate_(["a"], "z"), false);
  assert.equal(isDuplicate_([], "z"), false);
});

test("buildRow_: 18 cột đúng thứ tự spec 7.5, SĐT còn số 0, học phí là number", () => {
  const row = buildRow_(payload(), "2026-10-24 09:00:00");
  assert.equal(row.length, 18);
  assert.equal(row[0], "2026-10-24 09:00:00");
  assert.equal(row[1], "Mới");
  assert.equal(row[2], "Nguyễn Minh An");
  assert.equal(row[5], "0901234567");
  assert.equal(typeof row[13], "number");
  assert.equal(typeof row[14], "number");
  assert.equal(row[14], 3600000);
  assert.equal(row[15], "Tối T2–T6; Sáng T7");
  assert.equal(row[16], '=HYPERLINK("x")');
  assert.equal(row[17], "abc-123");
});

test("LOCK_WAIT_MS: chờ khoá lâu hơn timeout 10 giây của trình duyệt, để quá tải thành lỗi nhìn thấy được thay vì mất dòng", () => {
  assert.ok(LOCK_WAIT_MS >= 30000);
});
