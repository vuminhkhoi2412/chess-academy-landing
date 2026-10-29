// src/components/EnrolmentForm.tsx
//
// Form đăng ký học thử đặt thẳng trên trang (không còn hộp thoại). Cuống kraft bên trái hiện dần
// những gì phụ huynh đang điền; gửi xong thì cả form được thay bằng vé xác nhận.
// Phần thuần (kiểm tra, dựng payload, gửi) nằm ở src/lib/enrolment.ts.
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { PUBLIC_GOOGLE_SHEETS_ENDPOINT } from "astro:env/client";
import { AlertCircle, ArrowRight } from "lucide-react";
import { BRANCHES, BRAND_INFO, LEARNING_MODES } from "../data/courses";
import {
  buildEnrolmentPayload,
  newSubmissionId,
  postEnrolment,
  validateEnrolmentFields,
  type EnrolmentError,
} from "../lib/enrolment";
import EnrolmentTicket from "./EnrolmentTicket";

type SubmitState = "form" | "sending" | "sent" | "error";

// Id của ô đầu tiên bị lỗi, theo từng loại lỗi, để đưa focus tới đúng chỗ.
const FIELD_ID: Record<EnrolmentError, string> = {
  name: "gc-child-name",
  age: "gc-child-age",
  parent: "gc-parent-name",
  phone: "gc-phone",
  mode: "gc-mode",
  branch: "gc-branch",
};

const ERROR_TEXT: Record<EnrolmentError, string> = {
  name: "Vui lòng nhập họ tên của bé.",
  age: "Vui lòng nhập năm sinh hoặc tuổi của bé.",
  parent: "Vui lòng nhập họ tên phụ huynh.",
  phone: "Số điện thoại cần ít nhất 10 chữ số. Vui lòng kiểm tra lại.",
  mode: "Vui lòng chọn hình thức học.",
  branch: "Vui lòng chọn cơ sở.",
};

const FORM_ID = "dang-ky";

/** Cuộn tới form và đưa focus vào ô đầu tiên (nếu form còn đang hiện). Dùng cho các nút ở bảng giá. */
export function scrollToEnrolment() {
  document.getElementById(FORM_ID)?.scrollIntoView();
  document.getElementById(FIELD_ID.name)?.focus({ preventScroll: true });
}

const inputClass = (invalid: boolean) =>
  `block w-full min-h-12 rounded-control border bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none placeholder:text-slate-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-800 ${
    invalid ? "border-red-700 bg-red-50" : "border-slate-500"
  }`;

const labelClass = "mb-1.5 block text-sm font-semibold text-slate-700";

function FieldError({ id, error, errors }: { id: string; error: EnrolmentError; errors: EnrolmentError[] }) {
  if (!errors.includes(error)) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-semibold text-red-700">
      {ERROR_TEXT[error]}
    </p>
  );
}

export default function EnrolmentForm() {
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  // Hình thức học và cơ sở không chọn sẵn: nếu có giá trị mặc định thì cuống vé sẽ hiện thông tin
  // mà phụ huynh chưa hề chọn.
  const [mode, setMode] = useState("");
  const [branchId, setBranchId] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("form");
  const [errors, setErrors] = useState<EnrolmentError[]>([]);

  // Màn xác nhận thay form nên ô vừa gõ bị gỡ; đưa focus về đây để không rơi ra <body>.
  const resultRef = useRef<HTMLDivElement>(null);
  // Giữ nguyên qua các lần "Gửi lại" để Apps Script bỏ qua bản trùng; xoá khi bắt đầu đăng ký mới.
  const payloadRef = useRef<ReturnType<typeof buildEnrolmentPayload> | null>(null);
  // Tăng mỗi lần bắt đầu đăng ký mới, để kết quả của lần gửi cũ không lật form trắng sang "sent".
  const attemptRef = useRef(0);
  const sentAtRef = useRef(new Date());

  const branch = BRANCHES.find((b) => b.id === branchId);
  const filledCount = [childName, childAge, parentName, phone, mode, branchId].filter(
    (v) => v.trim() !== ""
  ).length;

  const resetForm = () => {
    setChildName("");
    setChildAge("");
    setParentName("");
    setPhone("");
    setMode("");
    setBranchId("");
    setHoneypot("");
    setErrors([]);
    setSubmitState("form");
    payloadRef.current = null;
    attemptRef.current += 1;
  };

  // Thẻ "Chọn cơ sở này" ở phần Hệ thống cơ sở bắn sự kiện này để chọn sẵn đúng cơ sở. Đã gửi xong
  // thì coi như bắt đầu một đăng ký mới, nếu không form điền sẵn dữ liệu cũ sẽ đẻ ra dòng thứ hai.
  const submitStateRef = useRef(submitState);
  submitStateRef.current = submitState;
  useEffect(() => {
    function onChooseBranch(event: Event) {
      const id = (event as CustomEvent<{ branchId?: string }>).detail?.branchId;
      if (!id || !BRANCHES.some((b) => b.id === id)) return;
      if (submitStateRef.current === "sent") resetForm();
      setBranchId(id);
      setErrors((current) => current.filter((e) => e !== "branch"));
      document.getElementById(FIELD_ID.name)?.focus({ preventScroll: true });
    }
    window.addEventListener("gc:choose-branch", onChooseBranch);
    return () => window.removeEventListener("gc:choose-branch", onChooseBranch);
  }, []);

  useEffect(() => {
    if (submitState === "sent") resultRef.current?.focus({ preventScroll: true });
  }, [submitState]);

  const sendPayload = async () => {
    const payload = payloadRef.current;
    if (!payload) return;
    const attempt = attemptRef.current;
    setSubmitState("sending");
    try {
      await postEnrolment(PUBLIC_GOOGLE_SHEETS_ENDPOINT, payload);
      if (attempt === attemptRef.current) setSubmitState("sent");
    } catch {
      if (attempt === attemptRef.current) setSubmitState("error");
    }
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitState === "sending") return;

    const problems = validateEnrolmentFields({ childName, childAge, parentName, phone, mode, branchId });
    setErrors(problems);
    if (problems.length > 0) {
      document.getElementById(FIELD_ID[problems[0]])?.focus();
      return;
    }

    const build = (submissionId: string) =>
      buildEnrolmentPayload({
        childName,
        childAge,
        parentName,
        phone,
        branch: { name: branch?.name ?? "", address: branch?.address ?? "" },
        // Form chỉ còn là đăng ký học thử: không có khóa, cấp độ hay học phí. Cấp độ do giáo viên
        // xếp sau ván thử (level null → "auto"); hình thức học đi vào cột Ghi chú vì Code.gs chưa
        // có cột riêng.
        program: "Học thử miễn phí",
        level: null,
        tuitionEstimate: 0,
        note: `Hình thức học: ${mode}`,
        submissionId,
        honeypot,
      });
    // "Gửi lại" sau lỗi mạng giữ nguyên mã gửi để Apps Script bỏ qua bản trùng. Nếu phụ huynh đã
    // sửa ô nào đó sau lỗi thì nội dung khác, phải dùng mã mới để bản sửa không bị coi là trùng.
    const previous = payloadRef.current;
    let next = build(previous ? String(previous.submission_id) : newSubmissionId());
    if (previous && JSON.stringify(next) !== JSON.stringify(previous)) next = build(newSubmissionId());
    payloadRef.current = next;
    sentAtRef.current = new Date();
    void sendPayload();
  };

  const clearError = (error: EnrolmentError) =>
    setErrors((current) => (current.includes(error) ? current.filter((e) => e !== error) : current));

  if (submitState === "sent") {
    return (
      <div>
        <EnrolmentTicket
          childName={childName}
          childAge={childAge}
          parentName={parentName}
          phone={phone}
          mode={mode}
          branchName={(branch?.name ?? "").replace(/^Cơ sở\s+/, "")}
          submittedAt={sentAtRef.current}
        />
        <div ref={resultRef} tabIndex={-1} className="mx-auto mt-8 max-w-md text-center outline-none">
          <p className="font-display text-xl font-bold leading-snug text-white">
            Cảm ơn ba mẹ đã để lại thông tin. 
          </p>
          <p className="mt-2 text-sm leading-relaxed text-brand-100">
            Trung tâm đã nhận thông tin và sẽ liên hệ qua số{" "}
            <span className="font-semibold tabular-nums text-white">{phone.trim()}</span> để trao đổi khung giờ và xếp
            lớp cho bé.
          </p>
          <a
            href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
            target="_blank"
            rel="noreferrer"
            className="gc-move gc-move--zalo gc-move--block mt-5"
          >
            <span className="gc-move__label">Nhắn Zalo trung tâm ngay</span>
            <span className="gc-move__go" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </span>
          </a>
          <button type="button" onClick={resetForm} className="gc-move gc-move--quiet gc-move--block mt-3 cursor-pointer">
            <span className="gc-move__label">Đăng ký thêm cho bé khác</span>
            <span className="gc-move__go" aria-hidden="true">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  const sending = submitState === "sending";
  const stubRows: { label: string; value: string; numeric?: boolean }[] = [
    { label: "Học viên", value: childName.trim() },
    { label: "Năm sinh / tuổi", value: childAge.trim() },
    { label: "Phụ huynh", value: parentName.trim() },
    { label: "Số điện thoại Zalo", value: phone.trim(), numeric: true },
    { label: "Hình thức học", value: mode },
    { label: "Cơ sở", value: branch?.name ?? "" },
  ];

  return (
    <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="gc-enrol scroll-mt-24" aria-label="Đăng ký học thử">
      {/* Bản xem trước: chỉ lặp lại những gì đã nằm trong các ô nhập nên ẩn khỏi trình đọc màn hình. */}
      <div className="gc-enrol__stub" aria-hidden="true">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-brand-200">Vé học thử</div>
        <p className="mt-1 font-display text-2xl font-extrabold leading-[1.1] tracking-[-0.015em] text-white">
          Global Chess
        </p>
        <p className="mt-2 inline-block bg-amber-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-950">
          Miễn phí
        </p>
        {filledCount === 0 && (
          <p className="mt-3.5 text-sm text-brand-100">Thông tin ba mẹ điền sẽ hiện ở đây.</p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-1">
          {stubRows
            .filter((row) => row.value !== "")
            .map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="text-xs font-semibold text-brand-200">{row.label}</dt>
                <dd className={`break-words font-semibold ${row.numeric ? "tabular-nums" : ""}`}>{row.value}</dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="gc-enrol__main">
        {/* Khoá mọi ô khi đang gửi, để vé xác nhận không hiện dữ liệu khác với dòng đã vào sheet. */}
        <fieldset disabled={sending} className="min-w-0">
          <legend className="sr-only">Thông tin đăng ký học thử</legend>
          <h4 className="font-display text-xl font-extrabold leading-tight tracking-[-0.01em]">
            Điền thông tin để nhận vé
          </h4>
          <p className="mt-1 text-sm text-slate-600">
            Trung tâm sẽ gọi hoặc nhắn Zalo để xếp lớp và khung giờ cho bé. Tất cả các ô đều cần điền.
          </p>

          {errors.length > 0 && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Còn {errors.length} ô chưa đúng, ba mẹ xem lại phần báo đỏ bên dưới.
            </p>
          )}

          {/* Bẫy spam: người thật không thấy và không điền; Apps Script bỏ qua nếu có giá trị. */}
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="gc-child-name" className={labelClass}>
                Họ tên bé
              </label>
              <input
                id="gc-child-name"
                type="text"
                autoComplete="off"
                placeholder="VD: Nguyễn Minh An"
                value={childName}
                aria-required="true"
                aria-invalid={errors.includes("name")}
                aria-describedby={errors.includes("name") ? "gc-child-name-error" : undefined}
                onChange={(e) => {
                  setChildName(e.target.value);
                  clearError("name");
                }}
                className={inputClass(errors.includes("name"))}
              />
              <FieldError id="gc-child-name-error" error="name" errors={errors} />
            </div>

            <div>
              <label htmlFor="gc-child-age" className={labelClass}>
                Năm sinh hoặc tuổi <span className="font-normal text-slate-600">(4–12 tuổi)</span>
              </label>
              <input
                id="gc-child-age"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="VD: 2016"
                value={childAge}
                aria-required="true"
                aria-invalid={errors.includes("age")}
                aria-describedby={errors.includes("age") ? "gc-child-age-error" : undefined}
                onChange={(e) => {
                  setChildAge(e.target.value);
                  clearError("age");
                }}
                className={inputClass(errors.includes("age"))}
              />
              <FieldError id="gc-child-age-error" error="age" errors={errors} />
            </div>

            <div>
              <label htmlFor="gc-parent-name" className={labelClass}>
                Họ tên phụ huynh
              </label>
              <input
                id="gc-parent-name"
                type="text"
                autoComplete="name"
                placeholder="VD: Chị Thảo"
                value={parentName}
                aria-required="true"
                aria-invalid={errors.includes("parent")}
                aria-describedby={errors.includes("parent") ? "gc-parent-name-error" : undefined}
                onChange={(e) => {
                  setParentName(e.target.value);
                  clearError("parent");
                }}
                className={inputClass(errors.includes("parent"))}
              />
              <FieldError id="gc-parent-name-error" error="parent" errors={errors} />
            </div>

            <div>
              <label htmlFor="gc-phone" className={labelClass}>
                Số điện thoại Zalo
              </label>
              <input
                id="gc-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="VD: 0901234567"
                value={phone}
                aria-required="true"
                aria-invalid={errors.includes("phone")}
                aria-describedby={errors.includes("phone") ? "gc-phone-error" : undefined}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError("phone");
                }}
                className={inputClass(errors.includes("phone"))}
              />
              <FieldError id="gc-phone-error" error="phone" errors={errors} />
            </div>

            <div>
              <label htmlFor="gc-mode" className={labelClass}>
                Hình thức học
              </label>
              <select
                id="gc-mode"
                value={mode}
                aria-required="true"
                aria-invalid={errors.includes("mode")}
                aria-describedby={errors.includes("mode") ? "gc-mode-error" : undefined}
                onChange={(e) => {
                  setMode(e.target.value);
                  clearError("mode");
                }}
                className={inputClass(errors.includes("mode"))}
              >
                <option value="" disabled>
                  Chọn hình thức học
                </option>
                {LEARNING_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.value}
                  </option>
                ))}
              </select>
              <FieldError id="gc-mode-error" error="mode" errors={errors} />
            </div>

            <div>
              <label htmlFor="gc-branch" className={labelClass}>
                Cơ sở học
              </label>
              <select
                id="gc-branch"
                value={branchId}
                aria-required="true"
                aria-invalid={errors.includes("branch")}
                aria-describedby={errors.includes("branch") ? "gc-branch-error" : undefined}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  clearError("branch");
                }}
                className={inputClass(errors.includes("branch"))}
              >
                <option value="" disabled>
                  Chọn cơ sở
                </option>
                {BRANCHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <FieldError id="gc-branch-error" error="branch" errors={errors} />
            </div>
          </div>

          {submitState === "error" && (
            <div role="alert" className="mt-5 rounded-control border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p className="flex items-start gap-2 font-semibold">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Chưa gửi được thông tin. Ba mẹ kiểm tra kết nối mạng và thử lại. Thông tin đã điền vẫn còn nguyên.
              </p>
              <a
                href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-11 items-center font-bold underline underline-offset-2"
              >
                Hoặc nhắn Zalo trung tâm ({BRAND_INFO.hotlines[0]})
              </a>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="gc-move gc-move--amber min-h-11 cursor-pointer text-sm disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="gc-move__label whitespace-nowrap">
                {sending ? "Đang gửi…" : submitState === "error" ? "Gửi lại" : "Gửi đăng ký"}
              </span>
              <span className="gc-move__go" aria-hidden="true">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>
          </div>
          <p className="mt-3.5 text-right text-sm text-slate-600">
            Chỉ dùng để liên hệ xếp lớp, không chia sẻ cho bên thứ ba.
          </p>
        </fieldset>
      </div>
    </form>
  );
}
