// src/components/PricingAndCheckout.tsx
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  TUITION_PROGRAMS,
  TUITION_LEVELS,
  BRANCHES,
  BRAND_INFO,
} from "../data/courses";
import { PUBLIC_GOOGLE_SHEETS_ENDPOINT } from "astro:env/client";
import {
  buildEnrolmentPayload,
  newSubmissionId,
  postEnrolment,
  validateEnrolment,
} from "../lib/enrolment";
import {
  Check,
  ArrowRight,
  X,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";
import PieceIcon from "./PieceIcon";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const DIALOG_TITLE_ID = "checkout-dialog-title";

type SubmitState = "form" | "sending" | "sent" | "error";

export default function PricingAndCheckout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLevelCode, setSelectedLevelCode] = useState(TUITION_LEVELS[0].code);
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].id);
  const [honeypot, setHoneypot] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("form");
  const [phoneError, setPhoneError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [parentError, setParentError] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  // Màn xác nhận/lỗi thay thế form nên nút vừa bấm bị gỡ; đưa focus về đây để không rơi ra <body>.
  const resultRef = useRef<HTMLDivElement>(null);
  // Giữ nguyên qua các lần "Thử lại" để Apps Script bỏ qua bản trùng; xoá khi mở hộp thoại.
  const payloadRef = useRef<ReturnType<typeof buildEnrolmentPayload> | null>(null);
  // Tăng mỗi lần mở hộp thoại, để kết quả của lần gửi cũ không lật form trắng sang "sent".
  const attemptRef = useRef(0);
  // Phần tử cần nhận lại focus khi hộp thoại đóng. Ghi lại ngay lúc người dùng
  // bấm, vì sau khi mở hộp thoại thì document.activeElement đã đổi.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Suy ra chương trình và số tiền từ cấp độ đã chọn. Học phí tạm tính luôn là gói
  // 24 buổi (2 buổi/tuần), cùng mức đang niêm yết ở bảng giá phía trên.
  const activeLevel =
    TUITION_LEVELS.find((level) => level.code === selectedLevelCode) || TUITION_LEVELS[0];

  const activeProgram =
    TUITION_PROGRAMS.find((program) => program.id === activeLevel.programId) ||
    TUITION_PROGRAMS[0];

  const tuitionAmount = activeLevel.group24;

  // Thẻ "Chọn cơ sở này" ở phần Hệ thống cơ sở bắn sự kiện này để mở sẵn đúng cơ sở.
  useEffect(() => {
    function onChooseBranch(event: Event) {
      const detail = (event as CustomEvent<{ branchId?: string; trigger?: unknown }>).detail;
      const branchId = detail?.branchId;
      if (!branchId || !BRANCHES.some((b) => b.id === branchId)) return;
      returnFocusRef.current =
        detail?.trigger instanceof HTMLElement ? detail.trigger : null;
      setSelectedBranch(branchId);
      resetForm();
      setIsModalOpen(true);
    }
    window.addEventListener("gc:choose-branch", onChooseBranch);
    return () => window.removeEventListener("gc:choose-branch", onChooseBranch);
  }, []);

  // Khoá cuộn trang, bắt phím Esc, giữ focus trong hộp thoại và trả focus khi đóng.
  useEffect(() => {
    if (!isModalOpen) return;

    const previouslyFocused =
      returnFocusRef.current ?? (document.activeElement as HTMLElement | null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function getFocusable(): HTMLElement[] {
      const root = dialogRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null && el.tabIndex >= 0
      );
    }

    // Đưa focus vào ô nhập đầu tiên (không phải nút đóng ở góc) để trình đọc
    // màn hình đọc ngay tên hộp thoại và trường cần điền.
    const firstField = dialogRef.current?.querySelector<HTMLElement>(
      "input:not([tabindex='-1']), select, textarea"
    );
    (firstField ?? getFocusable()[0])?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsModalOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
      returnFocusRef.current = null;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (submitState === "sent" || submitState === "error") resultRef.current?.focus();
  }, [submitState]);

  // Mở hộp thoại luôn đưa về form trắng (không reset lúc đóng, để phụ huynh lỡ tay đóng
  // giữa chừng vẫn thấy phần đã gõ). Nếu không, form điền sẵn dữ liệu vừa gửi sẽ đẻ ra dòng thứ hai.
  const resetForm = () => {
    setChildName("");
    setChildAge("");
    setParentName("");
    setPhone("");
    setHoneypot("");
    setNameError(false);
    setParentError(false);
    setPhoneError(false);
    setSubmitState("form");
    payloadRef.current = null;
    attemptRef.current += 1;
  };

  // Khi bấm vào một trong 3 thẻ bên ngoài -> chọn sẵn cấp độ đầu tiên của chương trình.
  const handleOpenModal = (
    program: (typeof TUITION_PROGRAMS)[number],
    trigger?: HTMLElement | null
  ) => {
    const firstLevel = TUITION_LEVELS.find((level) => level.programId === program.id);
    returnFocusRef.current = trigger ?? null;
    if (firstLevel) setSelectedLevelCode(firstLevel.code);
    resetForm();
    setIsModalOpen(true);
  };

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

    const problem = validateEnrolment({ childName, parentName, phone });
    setNameError(problem === "name");
    setParentError(problem === "parent");
    setPhoneError(problem === "phone");
    if (problem) return;

    payloadRef.current = buildEnrolmentPayload({
      childName,
      childAge,
      parentName,
      phone,
      branch: { name: currentBranchObj.name, address: currentBranchObj.address },
      program: activeProgram.name,
      level: { label: activeLevel.label, code: activeLevel.code },
      tuitionEstimate: tuitionAmount,
      note: "",
      submissionId: newSubmissionId(),
      honeypot,
    });
    void sendPayload();
  };

  const currentBranchObj = BRANCHES.find((b) => b.id === selectedBranch) ?? BRANCHES[0];

  return (
    <section id="pricing" className="relative overflow-hidden py-20 bg-brand-800 text-white">
      {/*
        Cùng ngôn ngữ hình khối với hero: một mặt phẳng bàn cờ tan dần ở rìa và một
        lớp hạt mịn. Dải navy này nằm giữa trang kem, nên nếu để phẳng nó đọc như
        một khối dán vào trang; lớp trang trí khiến nó thành một "màn đêm" có chủ đích.

        Lớp trang trí cố ý KHÔNG đặt z-index âm và section cố ý KHÔNG dùng `isolate`:
        hộp thoại đăng ký ở cuối section phải nằm trên thanh header và thanh liên hệ
        (cùng z-40). Nhốt section vào một stacking context riêng sẽ giam hộp thoại
        lại bên dưới hai thanh đó.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="gc-board-field gc-fade-radial absolute -left-28 -top-32 h-[34rem] w-[34rem] opacity-[0.18] [--gc-cell:3.5rem] [--gc-cell-color:var(--color-brand-600)]" />
        <div className="gc-grain absolute inset-0 opacity-[0.05]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="gc-eyebrow gc-eyebrow-invert">
            Đăng ký trực tuyến
          </span>
          <h2 className="gc-section-title text-3xl md:text-4xl lg:text-5xl font-extrabold mt-3">
            Tham khảo chi phí
          </h2>
        </div>

        {/* Bảng giá: mỗi khóa một hàng, quân cờ làm biểu tượng của khóa. */}
        <div className="border-b border-brand-600">
          {TUITION_PROGRAMS.map((program) => {
            const levels = TUITION_LEVELS.filter((level) => level.programId === program.id);
            const min12 = Math.min(...levels.map((level) => level.group12));
            const min24 = Math.min(...levels.map((level) => level.group24));
            const minOneOnOne = Math.min(...levels.map((level) => level.oneOnOne));
            const multipleTiers = new Set(levels.map((level) => level.group24)).size > 1;

            return (
              <article key={program.id} className={`gc-rate ${program.popular ? "gc-rate--pop" : ""}`}>
                <div className="flex items-start gap-4">
                  <div className="gc-rate__tile" aria-hidden="true">
                    <PieceIcon programId={program.id} className="size-10 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-display text-[1.375rem] font-extrabold leading-tight tracking-[-0.015em] text-white">
                      {program.name}
                      {program.popular && (
                        <span className="rounded-md bg-amber-500 px-2.5 py-0.5 font-sans text-[11px] font-bold uppercase tracking-wide text-slate-950">
                          Lộ trình tối ưu nhất
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-brand-200">{program.subtitle}</p>
                    <ul className="mt-3.5 grid gap-1.5 lg:grid-cols-2 lg:gap-x-6">
                      {program.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm leading-relaxed text-brand-100">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-200">
                    24 buổi (2 buổi/tuần)
                  </div>
                  <span className="block font-display text-[2rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-amber-400 tabular-nums">
                    {multipleTiers ? "từ " : ""}
                    {min24.toLocaleString("vi-VN")}đ
                  </span>
                  <div className="mt-2 text-[13px] leading-relaxed text-brand-200">
                    12 buổi: {min12.toLocaleString("vi-VN")}đ
                    <br />
                    1 kèm 1: từ {minOneOnOne.toLocaleString("vi-VN")}đ/buổi
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(event) => handleOpenModal(program, event.currentTarget)}
                  className={`gc-move gc-move--block ${
                    program.popular ? "gc-move--amber" : "gc-move--quiet"
                  } cursor-pointer`}
                >
                  <span className="gc-move__label">Đăng ký ngay</span>
                  <span className="gc-move__go" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* Modal Chọn Cơ Sở, Cấp Độ & gửi đăng ký */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-brand-950/85 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={DIALOG_TITLE_ID}
            className="bg-white text-slate-900 rounded-card max-w-xl w-full my-8 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden shadow-2xl"
          >
            {/*
              Đầu hộp thoại đứng yên, phần thân tự cuộn. Trước đây cả hộp thoại
              cuộn trong lớp phủ, nên trên điện thoại nút đóng trôi khỏi màn hình
              khi phụ huynh kéo xuống tới nút gửi — muốn thoát phải kéo ngược lên.
            */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-6 pb-4 pt-5 md:px-8">
              <div className="min-w-0 pr-2">
                {/* Badge tự động nhảy tên gói theo Cấp độ đăng ký */}
                <span className="gc-eyebrow text-sm">{activeProgram.name}</span>
                <h3 id={DIALOG_TITLE_ID} className="text-xl font-bold mt-2">
                  {submitState === "sent" ? "Đã gửi đăng ký" : "Đăng ký cơ sở & khung giờ học"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Đóng hộp thoại đăng ký"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {submitState === "form" || submitState === "sending" ? (
              <form
                onSubmit={handleSubmit}
                className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 md:px-8"
              >
                {/* Khoá mọi ô khi đang gửi, để màn xác nhận không hiện dữ liệu khác với dòng đã vào sheet. */}
                <fieldset disabled={submitState === "sending"} className="min-w-0 space-y-4">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gc-child-name" className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ tên học viên (bé) *
                    </label>
                    <input
                      id="gc-child-name"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="VD: Nguyễn Minh An"
                      value={childName}
                      aria-invalid={nameError}
                      aria-describedby={nameError ? "gc-child-name-error" : undefined}
                      onChange={(e) => {
                        setChildName(e.target.value);
                        setNameError(false);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-control focus:ring-2 outline-none ${
                        nameError
                          ? "border-red-400 focus:ring-red-500 bg-red-50/40"
                          : "border-slate-300 focus:ring-brand-800"
                      }`}
                    />
                    {nameError && (
                      <p id="gc-child-name-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        Vui lòng nhập họ tên của bé.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="gc-child-age" className="block text-sm font-semibold text-slate-700 mb-1">
                      Năm sinh / tuổi (4–12 tuổi) *
                    </label>
                    <input
                      id="gc-child-age"
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="VD: 2016 (10 tuổi)"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-control focus:ring-2 focus:ring-brand-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="gc-parent-name" className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ tên phụ huynh *
                    </label>
                    <input
                      id="gc-parent-name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="VD: Chị Thảo"
                      value={parentName}
                      aria-invalid={parentError}
                      aria-describedby={parentError ? "gc-parent-name-error" : undefined}
                      onChange={(e) => {
                        setParentName(e.target.value);
                        setParentError(false);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-control focus:ring-2 outline-none ${
                        parentError
                          ? "border-red-400 focus:ring-red-500 bg-red-50/40"
                          : "border-slate-300 focus:ring-brand-800"
                      }`}
                    />
                    {parentError && (
                      <p id="gc-parent-name-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        Vui lòng nhập họ tên phụ huynh.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="gc-phone" className="block text-sm font-semibold text-slate-700 mb-1">
                      Số điện thoại Zalo *
                    </label>
                    <input
                      id="gc-phone"
                      type="tel"
                      required
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="VD: 0901234567"
                      value={phone}
                      aria-invalid={phoneError}
                      aria-describedby={phoneError ? "gc-phone-error" : undefined}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError(false);
                      }}
                      className={`w-full px-3 py-2 text-sm border rounded-control focus:ring-2 outline-none ${
                        phoneError
                          ? "border-red-400 focus:ring-red-500 bg-red-50/40"
                          : "border-slate-300 focus:ring-brand-800"
                      }`}
                    />
                    {phoneError && (
                      <p id="gc-phone-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        Số điện thoại cần ít nhất 10 chữ số. Vui lòng kiểm tra lại.
                      </p>
                    )}
                  </div>
                </div>

                {/* Chọn Cơ sở & Cấp độ (Khi đổi Cấp độ, Giá tiền tự động đổi theo) */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gc-branch" className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" /> Chọn cơ sở Global Chess *
                    </label>
                    <select
                      id="gc-branch"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-control focus:ring-2 focus:ring-brand-800 outline-none bg-white"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} - {b.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="gc-level" className="block text-sm font-semibold text-slate-700 mb-1">
                      Cấp độ / khóa đăng ký *
                    </label>
                    <select
                      id="gc-level"
                      value={selectedLevelCode}
                      onChange={(e) => setSelectedLevelCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold border border-amber-400 rounded-control focus:ring-2 focus:ring-brand-800 outline-none bg-amber-50/40 text-slate-900"
                    >
                      {TUITION_LEVELS.map((level) => (
                        <option key={level.code} value={level.code}>
                          {level.label} — {level.group24.toLocaleString("vi-VN")}đ
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hộp hiển thị tổng tiền tự động cập nhật theo Cấp độ */}
                <div className="bg-slate-50 p-3.5 rounded-control border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 font-medium">Học phí tạm tính:</div>
                    <div className="text-sm text-amber-700 font-semibold">
                      {activeLevel.label} • 24 buổi
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {tuitionAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitState === "sending"}
                  className="gc-move gc-move--navy gc-move--block gc-move--lg cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="gc-move__label">
                    {submitState === "sending" ? "Đang gửi…" : "Gửi đăng ký"}
                    <span className="ml-auto whitespace-nowrap pl-3 font-semibold tabular-nums text-brand-200">
                      {tuitionAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </span>
                  <span className="gc-move__go" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
                </fieldset>
              </form>
            ) : submitState === "error" ? (
              <div
                ref={resultRef}
                tabIndex={-1}
                className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 text-center outline-none md:px-8"
              >
                <p role="alert" className="flex items-center justify-center gap-2 text-sm font-semibold text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Chưa gửi được thông tin. Vui lòng kiểm tra kết nối mạng và thử lại.
                </p>
                <button
                  type="button"
                  onClick={() => void sendPayload()}
                  className="gc-move gc-move--navy gc-move--block gc-move--lg cursor-pointer"
                >
                  <span className="gc-move__label">Thử lại</span>
                  <span className="gc-move__go" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
                <a
                  href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="gc-move gc-move--zalo gc-move--block"
                >
                  <span className="gc-move__label">Nhắn Zalo trung tâm ({BRAND_INFO.hotlines[0]})</span>
                  <span className="gc-move__go" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
              </div>
            ) : (
              <div
                ref={resultRef}
                tabIndex={-1}
                className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-6 py-5 outline-none md:px-8"
              >
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-emerald-600 text-white">
                    <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div className="space-y-1.5">
                    <p className="font-display text-lg font-bold leading-snug text-slate-900">
                      Cảm ơn ba mẹ đã tin tưởng gửi gắm bé {childName.trim()} cho Global Chess.
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Trung tâm đã nhận thông tin và sẽ liên hệ qua số{" "}
                      <span className="font-semibold tabular-nums text-slate-900">{phone.trim()}</span>{" "}
                      để trao đổi khung giờ và xếp lớp cho bé. Hẹn gặp bé trên bàn cờ!
                    </p>
                  </div>
                </div>

                {/* Phiếu tóm tắt: lưới nhãn trên / giá trị dưới, học phí tách thành cuống phiếu ở đáy. */}
                <div className="overflow-hidden rounded-control border border-slate-200 text-sm">
                  <dl className="grid gap-x-6 gap-y-4 bg-white p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Học viên</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {childName.trim()}
                        {childAge.trim() && (
                          <span className="font-normal text-slate-600"> · {childAge.trim()}</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Cấp độ</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {activeLevel.label}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-500">Cơ sở</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">{currentBranchObj.name}</dd>
                      <dd className="text-slate-600">{currentBranchObj.address}</dd>
                    </div>
                  </dl>
                  <div className="flex items-baseline justify-between gap-3 border-t border-dashed border-slate-300 bg-amber-50 px-4 py-3">
                    <span className="text-slate-600">
                      Học phí tạm tính
                      <span className="block text-xs text-slate-500">Trung tâm sẽ xác nhận lại khi xếp lớp</span>
                    </span>
                    <span className="font-display text-xl font-extrabold tabular-nums text-slate-900">
                      {tuitionAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                <div>
                  <a
                    href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="gc-move gc-move--zalo gc-move--block"
                  >
                    <span className="gc-move__label">Nhắn Zalo trung tâm ngay</span>
                    <span className="gc-move__go" aria-hidden="true">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-1 flex min-h-11 w-full cursor-pointer items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
