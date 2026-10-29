// tests/enrolment.test.mjs
// Chạy: npm test   (node --test)
//
// Khóa hợp đồng giữa form đăng ký và Google Apps Script: tên trường, thứ tự
// kiểm tra và cách gửi. Đổi một trong ba thì phải sửa cả `google-apps-script/Code.gs`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildEnrolmentPayload,
  formatAge,
  newSubmissionId,
  postEnrolment,
  validateEnrolment,
  validateEnrolmentFields,
} from "../src/lib/enrolment.ts";

const baseInput = () => ({
  childName: "  Nguyễn Minh An ",
  childAge: " 2016 (10 tuổi) ",
  parentName: " Chị Thảo ",
  phone: "+84 901.234.567",
  branch: { name: "Cơ sở Quận 1", address: "1 Lê Lợi" },
  program: "Sơ cấp",
  level: { label: "Sơ cấp 1", code: "SC1" },
  tuitionEstimate: 3600000,
  note: "  ",
  submissionId: "11111111-2222-3333-4444-555555555555",
  honeypot: "",
});

test("validateEnrolment: tên toàn khoảng trắng bị chặn", () => {
  assert.equal(validateEnrolment({ parentName: "Chị Thảo", childName: "   ", phone: "0901234567" }), "name");
});

test("validateEnrolment: SĐT 9 chữ số bị chặn", () => {
  assert.equal(validateEnrolment({ parentName: "Chị Thảo", childName: "An", phone: "0901 234 56" }), "phone");
});

test("validateEnrolment: SĐT có +84, dấu chấm, khoảng trắng vẫn hợp lệ", () => {
  assert.equal(validateEnrolment({ parentName: "Chị Thảo", childName: "An", phone: "+84 901.234.567" }), null);
});

test("validateEnrolment: tên và SĐT cùng sai thì báo tên trước", () => {
  assert.equal(validateEnrolment({ parentName: "Chị Thảo", childName: "", phone: "1" }), "name");
});

test("buildEnrolmentPayload: đủ 13 khoá khớp Code.gs", () => {
  assert.deepEqual(Object.keys(buildEnrolmentPayload(baseInput())).sort(), [
    "_hp", "branch", "branch_address", "child_age", "child_name", "level_code",
    "level_label", "note", "parent_name", "phone", "program", "submission_id",
    "tuition_estimate",
  ]);
});

test("buildEnrolmentPayload: SĐT chỉ còn chữ số, chuỗi được trim", () => {
  const p = buildEnrolmentPayload(baseInput());
  assert.equal(p.phone, "84901234567");
  assert.equal(p.child_name, "Nguyễn Minh An");
  assert.equal(p.note, "");
});

test("buildEnrolmentPayload: chưa chọn cấp thì level_code là 'auto'", () => {
  const p = buildEnrolmentPayload({ ...baseInput(), level: null });
  assert.equal(p.level_code, "auto");
  assert.equal(p.level_label, "Giáo viên xếp lớp sau ván thử");
});

test("buildEnrolmentPayload: tuition_estimate là number", () => {
  const p = buildEnrolmentPayload(baseInput());
  assert.equal(typeof p.tuition_estimate, "number");
});

test("buildEnrolmentPayload: dấu ngoặc kép, emoji, tiếng Việt qua JSON còn nguyên", () => {
  const p = buildEnrolmentPayload({ ...baseInput(), childName: 'Bé "An" 🙂 Nguyễn' });
  assert.equal(JSON.parse(JSON.stringify(p)).child_name, 'Bé "An" 🙂 Nguyễn');
});

test("buildEnrolmentPayload: cùng submissionId thì hai payload y hệt (Thử lại không đổi mã)", () => {
  assert.deepEqual(buildEnrolmentPayload(baseInput()), buildEnrolmentPayload(baseInput()));
});

test("postEnrolment: POST no-cors text/plain, body là JSON, có signal timeout", async () => {
  const original = globalThis.fetch;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return new Response(null);
  };
  try {
    const payload = buildEnrolmentPayload(baseInput());
    await postEnrolment("https://example.test/exec", payload);
    assert.equal(seen.url, "https://example.test/exec");
    assert.equal(seen.init.method, "POST");
    assert.equal(seen.init.mode, "no-cors");
    assert.equal(seen.init.headers["Content-Type"], "text/plain;charset=utf-8");
    assert.equal(seen.init.body, JSON.stringify(payload));
    assert.ok(seen.init.signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = original;
  }
});

test("postEnrolment: lỗi mạng được ném ra cho nơi gọi", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  try {
    await assert.rejects(postEnrolment("https://example.test/exec", {}), /Failed to fetch/);
  } finally {
    globalThis.fetch = original;
  }
});

test("validateEnrolment: tên phụ huynh toàn khoảng trắng bị chặn (script sẽ từ chối và phụ huynh không biết)", () => {
  assert.equal(
    validateEnrolment({ parentName: "   ", childName: "An", phone: "0901234567" }),
    "parent"
  );
});

test("validateEnrolment: thứ tự tên bé → phụ huynh → SĐT", () => {
  assert.equal(
    validateEnrolment({ parentName: "", childName: "", phone: "1" }),
    "name"
  );
  assert.equal(
    validateEnrolment({ parentName: "", childName: "An", phone: "1" }),
    "parent"
  );
});

test("postEnrolment: vẫn gửi được khi trình duyệt chưa có AbortSignal.timeout (iOS 15)", async () => {
  const originalFetch = globalThis.fetch;
  const originalTimeout = AbortSignal.timeout;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = init;
    return new Response(null);
  };
  AbortSignal.timeout = undefined;
  try {
    await postEnrolment("https://example.test/exec", {});
    assert.ok(seen.signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = originalFetch;
    AbortSignal.timeout = originalTimeout;
  }
});

test("newSubmissionId: vẫn sinh mã khác nhau khi không có crypto.randomUUID", () => {
  const original = crypto.randomUUID;
  Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
  try {
    const a = newSubmissionId();
    const b = newSubmissionId();
    assert.equal(typeof a, "string");
    assert.ok(a.length >= 16);
    assert.notEqual(a, b);
  } finally {
    Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
  }
});

const filled = () => ({
  childName: "An",
  childAge: "2016",
  parentName: "Chị Thảo",
  phone: "0901234567",
  mode: "Học online",
  branchId: "CS1",
});

test("validateEnrolmentFields: form đủ thông tin thì không có lỗi", () => {
  assert.deepEqual(validateEnrolmentFields(filled()), []);
});

test("validateEnrolmentFields: trả về mọi lỗi theo thứ tự trên màn hình", () => {
  assert.deepEqual(
    validateEnrolmentFields({
      childName: "",
      childAge: " ",
      parentName: "",
      phone: "1",
      mode: "",
      branchId: "",
    }),
    ["name", "age", "parent", "phone", "mode", "branch"]
  );
});

test("validateEnrolmentFields: ô không được truyền vào thì không bị coi là thiếu", () => {
  assert.deepEqual(
    validateEnrolmentFields({ childName: "An", parentName: "Chị Thảo", phone: "0901234567" }),
    []
  );
});

test("validateEnrolment: vẫn chỉ trả lỗi đầu tiên khi có nhiều lỗi", () => {
  assert.equal(validateEnrolment({ ...filled(), childAge: "", mode: "" }), "age");
});

test("formatAge: năm sinh được trừ ra tuổi", () => {
  assert.equal(formatAge("2016", 2026), "10 tuổi");
  assert.equal(formatAge(" 2017 ", 2026), "9 tuổi");
});

test("formatAge: số 1-2 chữ số được coi là tuổi", () => {
  assert.equal(formatAge("8", 2026), "8 tuổi");
  assert.equal(formatAge("08", 2026), "8 tuổi");
});

test("formatAge: chuỗi đã có chữ tuổi hoặc không nhận ra thì giữ nguyên", () => {
  assert.equal(formatAge("2016 (10 tuổi)", 2026), "2016 (10 tuổi)");
  assert.equal(formatAge("10 tuổi", 2026), "10 tuổi");
  assert.equal(formatAge("abc", 2026), "abc");
});

test("formatAge: năm sinh ở tương lai không bị trừ ra tuổi âm", () => {
  assert.equal(formatAge("2031", 2026), "2031");
});

test("formatAge: năm sinh nằm trong câu vẫn nhận ra", () => {
  assert.equal(formatAge("sinh năm 2018", 2026), "8 tuổi");
});
