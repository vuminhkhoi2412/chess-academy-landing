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

export type EnrolmentError = "name" | "parent" | "phone";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

// Thứ tự kiểm tra cũng là thứ tự báo lỗi: tên bé → phụ huynh → SĐT. Mọi trường
// Code.gs coi là bắt buộc phải được chặn ở đây: script từ chối thì trình duyệt không biết.
export function validateEnrolment(
  input: Pick<EnrolmentInput, "childName" | "parentName" | "phone">
): EnrolmentError | null {
  if (input.childName.trim() === "") return "name";
  if (input.parentName.trim() === "") return "parent";
  if (digitsOnly(input.phone).length < 10) return "phone";
  return null;
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
