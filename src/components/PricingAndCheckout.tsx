// src/components/PricingAndCheckout.tsx
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  TUITION_PROGRAMS,
  TUITION_LEVELS,
  BRANCHES,
  FLEXIBLE_TIME_SLOTS,
  BRAND_INFO,
} from "../data/courses";
import { BANK_CONFIG } from "../data/payment";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";

// Hình thức học lấy từ bảng học phí chính thức. Lớp 1 kèm 1 / 1 kèm 2 tính
// đơn giá mỗi buổi, nên có thêm lựa chọn số buổi đăng ký.
type TuitionFormat = "group12" | "group24" | "oneOnOne" | "oneOnTwo";

const FORMAT_OPTIONS: { value: TuitionFormat; label: string; short: string }[] = [
  { value: "group12", label: "Lớp group — 12 buổi (1 buổi/tuần)", short: "12 buổi" },
  { value: "group24", label: "Lớp group — 24 buổi (2 buổi/tuần)", short: "24 buổi" },
  { value: "oneOnOne", label: "Lớp 1 kèm 1 — tính theo buổi", short: "1 kèm 1" },
  { value: "oneOnTwo", label: "Lớp 1 kèm 2 — tính theo buổi", short: "1 kèm 2" },
];

const FORMAT_CODE: Record<TuitionFormat, string> = {
  group12: "G12",
  group24: "G24",
  oneOnOne: "P11",
  oneOnTwo: "P12",
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

const DIALOG_TITLE_ID = "checkout-dialog-title";

export default function PricingAndCheckout() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLevelCode, setSelectedLevelCode] = useState(TUITION_LEVELS[0].code);
  const [tuitionFormat, setTuitionFormat] = useState<TuitionFormat>("group24");
  const [privateSessions, setPrivateSessions] = useState(12);
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].id);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([FLEXIBLE_TIME_SLOTS[1]]);
  const [showQR, setShowQR] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [slotError, setSlotError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  // Phần tử cần nhận lại focus khi hộp thoại đóng. Ghi lại ngay lúc người dùng
  // bấm, vì sau khi mở hộp thoại thì document.activeElement đã đổi.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Suy ra cấp độ, chương trình và số tiền từ 3 lựa chọn: cấp độ, hình thức học
  // (12/24 buổi hoặc 1-1/1-2) và số buổi nếu học kèm riêng.
  const activeLevel =
    TUITION_LEVELS.find((level) => level.code === selectedLevelCode) || TUITION_LEVELS[0];

  const activeProgram =
    TUITION_PROGRAMS.find((program) => program.id === activeLevel.programId) ||
    TUITION_PROGRAMS[0];

  const isPrivateFormat = tuitionFormat === "oneOnOne" || tuitionFormat === "oneOnTwo";

  const privateRate =
    tuitionFormat === "oneOnOne" ? activeLevel.oneOnOne : activeLevel.oneOnTwo;

  const levelPrice = (level: (typeof TUITION_LEVELS)[number]) =>
    isPrivateFormat
      ? tuitionFormat === "oneOnOne"
        ? level.oneOnOne
        : level.oneOnTwo
      : tuitionFormat === "group12"
        ? level.group12
        : level.group24;

  const tuitionAmount = isPrivateFormat
    ? privateRate * privateSessions
    : levelPrice(activeLevel);

  const activeFormat = FORMAT_OPTIONS.find((format) => format.value === tuitionFormat) || FORMAT_OPTIONS[1];

  // Thẻ "Chọn cơ sở này" ở phần Hệ thống cơ sở bắn sự kiện này để mở sẵn đúng cơ sở.
  useEffect(() => {
    function onChooseBranch(event: Event) {
      const detail = (event as CustomEvent<{ branchId?: string; trigger?: unknown }>).detail;
      const branchId = detail?.branchId;
      if (!branchId || !BRANCHES.some((b) => b.id === branchId)) return;
      returnFocusRef.current =
        detail?.trigger instanceof HTMLElement ? detail.trigger : null;
      setSelectedBranch(branchId);
      setShowQR(false);
      setSlotError(false);
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
        (el) => el.offsetParent !== null
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

  // Dọn timer copy khi island bị gỡ khỏi DOM.
  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  const toggleSlot = (slot: string) => {
    setSlotError(false);
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const removeAccents = (str: string) =>
    str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toUpperCase();

  // Số điện thoại chỉ giữ chữ số để cú pháp chuyển khoản luôn sạch.
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  // Cú pháp chuyển khoản chuẩn Kế toán:
  // GC [Mã Cơ Sở] [Mã Cấp Độ] [Mã Hình Thức] [Tên Bé] [SĐT]
  const cleanChildName = removeAccents(childName || "HOCVIEN").replace(/\s+/g, "");
  const transferMemo = `GC ${selectedBranch} ${selectedLevelCode} ${FORMAT_CODE[tuitionFormat]} ${cleanChildName} ${cleanPhone}`;

  // Mã VietQR lấy trực tiếp số tiền từ lựa chọn cấp độ + hình thức học.
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${tuitionAmount}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Khi bấm vào một trong 3 thẻ bên ngoài -> chọn sẵn cấp độ đầu tiên của chương trình.
  const handleOpenModal = (
    program: (typeof TUITION_PROGRAMS)[number],
    trigger?: HTMLElement | null
  ) => {
    const firstLevel = TUITION_LEVELS.find((level) => level.programId === program.id);
    returnFocusRef.current = trigger ?? null;
    if (firstLevel) setSelectedLevelCode(firstLevel.code);
    setTuitionFormat("group24");
    setPrivateSessions(12);
    setShowQR(false);
    setSlotError(false);
    setIsModalOpen(true);
  };

  const handleGenerateQR = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (cleanPhone.length < 9) {
      setPhoneError(true);
      return;
    }
    setPhoneError(false);

    if (selectedSlots.length === 0) {
      setSlotError(true);
      return;
    }

    setShowQR(true);
    setQrLoaded(false);
    setQrError(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Clipboard API chỉ có trong secure context (https hoặc localhost). Khi trình
      // duyệt chặn hoặc không hỗ trợ, hiện thông báo để phụ huynh sao chép thủ công.
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API không khả dụng");
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 2400);
  };

  const currentBranchObj = BRANCHES.find((b) => b.id === selectedBranch);

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

        {/* 3 Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {TUITION_PROGRAMS.map((program) => {
            const levels = TUITION_LEVELS.filter((level) => level.programId === program.id);
            const min12 = Math.min(...levels.map((level) => level.group12));
            const min24 = Math.min(...levels.map((level) => level.group24));
            const minOneOnOne = Math.min(...levels.map((level) => level.oneOnOne));
            const multipleTiers = new Set(levels.map((level) => level.group24)).size > 1;

            return (
              <div
                key={program.id}
                className={`rounded-card p-7 flex flex-col justify-between border transition ${
                  program.popular
                    ? "bg-brand-700 border-amber-500 shadow-lifted relative"
                    : "bg-brand-700/40 border-brand-600 hover:border-brand-500"
                }`}
              >
                {program.popular && (
                  <span className="absolute -top-3.5 left-6 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-control uppercase tracking-wide">
                    Lộ trình tối ưu nhất
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{program.name}</h3>
                  {/*
                    Chừa đúng 2 dòng phụ đề để hàng giá của 3 thẻ luôn thẳng nhau.
                    3.25em = 2 dòng × leading-relaxed (1.625), nên giá trị này ăn theo
                    chính cỡ chữ của phụ đề thay vì một số rem đoán trước.
                  */}
                  <p className="text-brand-200 text-sm mt-1.5 leading-relaxed min-h-[3.25em]">
                    {program.subtitle}
                  </p>

                  <div className="my-5 pb-5 border-b border-brand-600">
                    <div className="text-brand-200 text-xs font-semibold uppercase tracking-wider">
                      24 buổi (2 buổi/tuần)
                    </div>
                    <span className="text-3xl font-extrabold text-amber-400 tabular-nums">
                      {multipleTiers ? "từ " : ""}
                      {min24.toLocaleString("vi-VN")}đ
                    </span>
                    <div className="text-brand-200 text-xs mt-1.5 leading-relaxed">
                      12 buổi: {min12.toLocaleString("vi-VN")}đ
                      <br />
                      1 kèm 1: từ {minOneOnOne.toLocaleString("vi-VN")}đ/buổi
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-8">
                    {program.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-brand-100 leading-relaxed">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
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
              </div>
            );
          })}
        </div>

        {/*
          Dải dữ kiện dùng chung. Ba thẻ học phí luôn phải đứng cạnh nhau để so sánh,
          nhưng một hàng thông tin chung bên dưới làm dịu thế "3 tòa tháp".
        */}
        <div className="mt-10 rounded-card border border-brand-600 bg-brand-700/40 p-6 md:p-7">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-5">
            Mọi gói học phí đều bao gồm
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Lớp group từ 2 học viên, hoặc 1 kèm 1 / 1 kèm 2",
              "Ca tối trong tuần hoặc cuối tuần (T7 – CN)",
              "Kiểm tra đánh giá định kỳ và cuối khóa",
              "Tự chọn cơ sở trong 5 địa điểm tại TP.HCM",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-brand-100 leading-relaxed">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modal Chọn Cơ Sở, Cấp Độ & VietQR */}
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
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-control">
                  {activeProgram.name}
                </span>
                <h3 id={DIALOG_TITLE_ID} className="text-xl font-bold mt-2">
                  {showQR ? "Quét mã VietQR để hoàn tất học phí" : "Đăng ký cơ sở & khung giờ học"}
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

            {!showQR ? (
              <form
                onSubmit={handleGenerateQR}
                className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 md:px-8"
              >
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
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none"
                    />
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
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none"
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
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none"
                    />
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
                          : "border-slate-300 focus:ring-amber-500"
                      }`}
                    />
                    {phoneError && (
                      <p id="gc-phone-error" role="alert" className="mt-1 text-xs font-semibold text-red-600">
                        Số điện thoại cần ít nhất 9 chữ số. Vui lòng kiểm tra lại.
                      </p>
                    )}
                  </div>
                </div>

                {/* Chọn Cơ sở & Cấp độ (Khi đổi Cấp độ, Giá tiền tự động đổi theo) */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gc-branch" className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Chọn cơ sở Global Chess *
                    </label>
                    <select
                      id="gc-branch"
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none bg-white"
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
                      className="w-full px-3 py-2 text-sm font-semibold border border-amber-400 rounded-control focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/40 text-slate-900"
                    >
                      {TUITION_LEVELS.map((level) => (
                        <option key={level.code} value={level.code}>
                          {level.label} — {levelPrice(level).toLocaleString("vi-VN")}đ
                          {isPrivateFormat ? "/buổi" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hình thức học lấy từ bảng học phí: 12/24 buổi hoặc kèm riêng. */}
                <div className={`grid gap-3 ${isPrivateFormat ? "sm:grid-cols-2" : ""}`}>
                  <div>
                    <label htmlFor="gc-format" className="block text-sm font-semibold text-slate-700 mb-1">
                      Hình thức học *
                    </label>
                    <select
                      id="gc-format"
                      value={tuitionFormat}
                      onChange={(e) => setTuitionFormat(e.target.value as TuitionFormat)}
                      className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      {FORMAT_OPTIONS.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isPrivateFormat && (
                    <div>
                      <label htmlFor="gc-private-sessions" className="block text-sm font-semibold text-slate-700 mb-1">
                        Số buổi đăng ký *
                      </label>
                      <select
                        id="gc-private-sessions"
                        value={privateSessions}
                        onChange={(e) => setPrivateSessions(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-control focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      >
                        {[12, 24].map((sessions) => (
                          <option key={sessions} value={sessions}>
                            {sessions} buổi — {(privateRate * sessions).toLocaleString("vi-VN")}đ
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Chọn các khung thời gian rảnh */}
                <fieldset>
                  <legend className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Khung giờ bé có thể tham gia (có thể chọn nhiều) *
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {FLEXIBLE_TIME_SLOTS.map((slot) => {
                      const checked = selectedSlots.includes(slot);
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => toggleSlot(slot)}
                          aria-pressed={checked}
                          className={`text-left text-sm p-2.5 rounded-control border transition flex items-center gap-2 cursor-pointer active:scale-[0.99] ${
                            checked
                              ? "bg-amber-50 border-amber-500 text-slate-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                              checked ? "bg-amber-500 border-amber-500 text-white" : "border-slate-400"
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </span>
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                  {slotError && (
                    <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      Vui lòng chọn ít nhất 1 khung thời gian rảnh của bé để trung tâm xếp lớp.
                    </p>
                  )}
                </fieldset>

                {/* Hộp hiển thị tổng tiền tự động cập nhật theo Cấp độ & Hình thức học */}
                <div className="bg-slate-50 p-3.5 rounded-control border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 font-medium">Học phí cần thanh toán:</div>
                    <div className="text-sm text-amber-700 font-semibold">
                      {activeLevel.label} • {activeLevel.sessionLength}/buổi • {activeFormat.short}
                      {isPrivateFormat ? ` × ${privateSessions} buổi` : ""}
                    </div>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {tuitionAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <button
                  type="submit"
                  className="gc-move gc-move--navy gc-move--block gc-move--lg cursor-pointer"
                >
                  <span className="gc-move__label">
                    Tạo mã VietQR
                    <span className="ml-auto whitespace-nowrap pl-3 font-semibold tabular-nums text-brand-200">
                      {tuitionAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </span>
                  <span className="gc-move__go" aria-hidden="true">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
              </form>
            ) : (
              <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-6 py-5 text-center md:px-8">
                <div className="relative mx-auto h-56 w-56 overflow-hidden rounded-control border border-slate-200 bg-slate-50">
                  {!qrLoaded && !qrError && (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-medium text-slate-500">
                      Đang tạo mã QR…
                    </div>
                  )}
                  {qrError && (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-semibold text-red-600">
                      Không tải được mã QR. Vui lòng thử lại.
                    </div>
                  )}
                  {!qrError && (
                    <img
                      src={qrUrl}
                      alt={`Mã VietQR thanh toán ${tuitionAmount.toLocaleString("vi-VN")} đồng cho ${BRAND_INFO.name}`}
                      width={224}
                      height={224}
                      decoding="async"
                      onLoad={() => setQrLoaded(true)}
                      onError={() => setQrError(true)}
                      className={`h-full w-full object-contain transition-opacity duration-200 ${qrLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                </div>

                <div className="text-left bg-amber-50/80 border border-amber-200 rounded-control p-3.5 text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Học viên:</span>
                    <span className="font-bold text-slate-900 text-right">{childName} ({childAge})</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Cấp độ đăng ký:</span>
                    <span className="font-bold text-amber-800 text-right">
                      {activeLevel.label} ({activeLevel.sessionLength}/buổi)
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Hình thức học:</span>
                    <span className="font-bold text-amber-800 text-right">
                      {activeFormat.short}
                      {isPrivateFormat
                        ? ` × ${privateSessions} buổi (${privateRate.toLocaleString("vi-VN")}đ/buổi)`
                        : ""}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Số tiền học phí:</span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {tuitionAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Cơ sở đăng ký:</span>
                    <span className="font-semibold text-slate-900 text-right">{currentBranchObj?.address}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Khung giờ đã chọn:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                      {selectedSlots.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-3 pt-1.5 border-t border-amber-200">
                    <span className="text-slate-500 shrink-0">Nội dung CK tự động:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferMemo)}
                      className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 hover:underline cursor-pointer rounded-control"
                      aria-label={`Sao chép nội dung chuyển khoản: ${transferMemo}`}
                    >
                      <span className="break-all text-right">{transferMemo}</span>
                      {copied ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <p role="status" aria-live="polite" className="text-sm font-semibold">
                    {copied && <span className="text-emerald-700">Đã sao chép nội dung chuyển khoản.</span>}
                    {copyFailed && (
                      <span className="text-red-600">
                        Trình duyệt chặn sao chép. Vui lòng bôi đen và sao chép thủ công.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  Quét bằng bất kỳ app ngân hàng nào để tự động điền đúng số tiền và cú pháp.
                </div>

                <div className="pt-1">
                  <a
                    href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="gc-move gc-move--zalo gc-move--block"
                  >
                    <span className="gc-move__label">
                      Đã chuyển khoản • Báo Zalo trung tâm ({BRAND_INFO.hotlines[0]})
                    </span>
                    <span className="gc-move__go" aria-hidden="true">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowQR(false)}
                    className="mt-1 flex min-h-11 w-full cursor-pointer items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-slate-800"
                  >
                    Sửa thông tin
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
