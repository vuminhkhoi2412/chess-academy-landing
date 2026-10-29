// src/lib/enrolment.ts
//
// Phần thuần của form đăng ký: kiểm tra, dựng payload, gửi sang Google Apps Script.
// Không import React hay `astro:*` để `node --test` đọc thẳng được.
// Tên trường payload khớp với `google-apps-script/Code.gs`; sửa một bên phải sửa bên kia.

export interface EnrolmentInput {
  childName: string;
  childAge: string;
  parentName: string;
  phone: string;
  branch: { name: string; address: string };
  program: string;
  level: { label: string; code: string } | null;
  tuitionEstimate: number;
  note: string;
  submissionId: string;
  honeypot: string;
}

export type EnrolmentError = "name" | "age" | "parent" | "phone" | "mode" | "branch";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

// Mọi trường Code.gs coi là bắt buộc (tên bé, phụ huynh, SĐT) phải được chặn ở đây: script
// từ chối thì trình duyệt không biết. Năm sinh/tuổi, hình thức học và cơ sở là các ô form bắt
// buộc nhưng Code.gs không đòi; chỉ kiểm tra khi nơi gọi truyền vào (undefined = bỏ qua).
export type EnrolmentFields = Pick<EnrolmentInput, "childName" | "parentName" | "phone"> & {
  childAge?: string;
  mode?: string;
  branchId?: string;
};

// Trả về TẤT CẢ lỗi, theo thứ tự trên màn hình: tên bé → tuổi → phụ huynh → SĐT → hình thức → cơ sở.
export function validateEnrolmentFields(input: EnrolmentFields): EnrolmentError[] {
  const errors: EnrolmentError[] = [];
  if (input.childName.trim() === "") errors.push("name");
  if (input.childAge !== undefined && input.childAge.trim() === "") errors.push("age");
  if (input.parentName.trim() === "") errors.push("parent");
  if (digitsOnly(input.phone).length < 10) errors.push("phone");
  if (input.mode !== undefined && input.mode === "") errors.push("mode");
  if (input.branchId !== undefined && input.branchId === "") errors.push("branch");
  return errors;
}

// Lỗi đầu tiên (hoặc null). Giữ nguyên hành vi cũ cho nơi chỉ cần một lỗi.
export function validateEnrolment(input: EnrolmentFields): EnrolmentError | null {
  return validateEnrolmentFields(input)[0] ?? null;
}

// Phụ huynh có thể gõ năm sinh (2016) hoặc tuổi (10). Năm sinh được đổi thành tuổi bằng
// năm hiện tại trừ năm sinh, chưa tính tháng sinh nên có thể lệch một tuổi. Chuỗi đã có chữ
// "tuổi", hoặc không nhận ra được, được giữ nguyên như đã gõ.
export function formatAge(raw: string, year = new Date().getFullYear()): string {
  const value = raw.trim();
  if (/tuổi/i.test(value)) return value;
  const born = value.match(/\b(?:19|20)\d{2}\b/)?.[0];
  if (born && Number(born) <= year) return `${year - Number(born)} tuổi`;
  if (/^\d{1,2}$/.test(value)) return `${Number(value)} tuổi`;
  return value;
}

export function buildEnrolmentPayload(input: EnrolmentInput): Record<string, string | number> {
  return {
    child_name: input.childName.trim(),
    child_age: input.childAge.trim(),
    parent_name: input.parentName.trim(),
    phone: digitsOnly(input.phone),
    branch: input.branch.name,
    branch_address: input.branch.address,
    program: input.program,
    level_label: input.level?.label ?? "Giáo viên xếp lớp sau ván thử",
    level_code: input.level?.code ?? "auto",
    tuition_estimate: input.tuitionEstimate,
    note: input.note.trim(),
    submission_id: input.submissionId,
    _hp: input.honeypot,
  };
}

// `no-cors`: response của Apps Script không có header CORS, nên trình duyệt trả response
// rỗng và trang không biết dòng đã vào sheet hay chưa. fetch chỉ ném lỗi khi mất mạng hoặc
// quá 10 giây; `submission_id` giữ cho việc thử lại không sinh dòng trùng.
// AbortController thay cho AbortSignal.timeout vì iOS 15 chưa có hàm đó.
export async function postEnrolment(endpoint: string, payload: object): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// crypto.randomUUID cần Safari 15.4+; máy cũ hơn rơi về getRandomValues.
export function newSubmissionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
