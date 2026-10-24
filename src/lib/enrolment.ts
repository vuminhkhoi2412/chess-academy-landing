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
  format: { label: string; code: string };
  sessions: number;
  tuitionEstimate: number;
  timeSlots: string[];
  note: string;
  submissionId: string;
  honeypot: string;
}

export type EnrolmentError = "name" | "phone" | "slots";

const digitsOnly = (value: string) => value.replace(/[^0-9]/g, "");

// Thứ tự kiểm tra cũng là thứ tự báo lỗi: tên → SĐT → khung giờ.
export function validateEnrolment(
  input: Pick<EnrolmentInput, "childName" | "phone" | "timeSlots">
): EnrolmentError | null {
  if (input.childName.trim() === "") return "name";
  if (digitsOnly(input.phone).length < 10) return "phone";
  if (input.timeSlots.length === 0) return "slots";
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
    format_label: input.format.label,
    format_code: input.format.code,
    sessions: input.sessions,
    tuition_estimate: input.tuitionEstimate,
    time_slots: input.timeSlots.join("; "),
    note: input.note.trim(),
    submission_id: input.submissionId,
    _hp: input.honeypot,
  };
}

// `no-cors`: response của Apps Script không có header CORS, nên trình duyệt trả response
// rỗng và trang không biết dòng đã vào sheet hay chưa. fetch chỉ ném lỗi khi mất mạng hoặc
// quá 10 giây; `submission_id` giữ cho việc thử lại không sinh dòng trùng.
export async function postEnrolment(endpoint: string, payload: object): Promise<void> {
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
}
