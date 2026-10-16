// src/components/PricingAndCheckout.tsx
import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import {
  PRICING_PACKAGES,
  BRANCHES,
  FLEXIBLE_TIME_SLOTS,
  BRAND_INFO,
} from "../data/courses";
import { BANK_CONFIG } from "../data/payment";
import {
  Check,
  QrCode,
  ShieldCheck,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
} from "lucide-react";

// Gắn từng Cấp độ đăng ký với Gói học phí (packageId) tương ứng
const LEVEL_OPTIONS = [
  {
    code: "SC1",
    label: "Sơ cấp 1 (Level 1 - 24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "SC2",
    label: "Sơ cấp 2 (Level 2 - 24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "TC1",
    label: "Trung cấp Quyển 1 (24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "TC2",
    label: "Trung cấp Quyển 2 (24 buổi)",
    packageId: "hoc-phan-24",
  },
  {
    code: "SCFULL",
    label: "Trọn lộ trình Sơ cấp (48 buổi - Ưu đãi)",
    packageId: "lo-trinh-48",
  },
  {
    code: "TCFULL",
    label: "Trọn lộ trình Trung cấp (48 buổi - Ưu đãi)",
    packageId: "lo-trinh-48",
  },
  {
    code: "VIP11",
    label: "Kèm riêng 1-1 theo yêu cầu (12 buổi)",
    packageId: "kem-1-1",
  },
];

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
  const [selectedLevelCode, setSelectedLevelCode] = useState(LEVEL_OPTIONS[0].code);
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0].id);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([FLEXIBLE_TIME_SLOTS[1]]);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [slotError, setSlotError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<number | undefined>(undefined);
  // Phần tử cần nhận lại focus khi hộp thoại đóng. Ghi lại ngay lúc người dùng
  // bấm, vì sau khi mở hộp thoại thì document.activeElement đã đổi.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Tự động suy ra thông tin Cấp độ & Gói giá tiền dựa trên dropdown "Cấp độ đăng ký"
  const activeLevelObj =
    LEVEL_OPTIONS.find((lvl) => lvl.code === selectedLevelCode) || LEVEL_OPTIONS[0];

  const activePackage =
    PRICING_PACKAGES.find((pkg) => pkg.id === activeLevelObj.packageId) || PRICING_PACKAGES[0];

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

  // Cú pháp chuyển khoản chuẩn Kế toán: GC [Mã Cơ Sở] [Mã Cấp Độ] [Tên Bé] [SĐT]
  const cleanChildName = removeAccents(childName || "HOCVIEN").replace(/\s+/g, "");
  const transferMemo = `GC ${selectedBranch} ${selectedLevelCode} ${cleanChildName} ${cleanPhone}`;

  // Mã VietQR lấy trực tiếp số tiền từ activePackage.price (ăn theo Cấp độ đăng ký)
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${activePackage.price}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Khi bấm vào 1 trong 3 thẻ bên ngoài -> Chọn sẵn cấp độ mặc định của thẻ đó
  const handleOpenModal = (
    pkg: typeof PRICING_PACKAGES[0],
    trigger?: HTMLElement | null
  ) => {
    returnFocusRef.current = trigger ?? null;
    if (pkg.id === "lo-trinh-48") {
      setSelectedLevelCode("SCFULL");
    } else if (pkg.id === "kem-1-1") {
      setSelectedLevelCode("VIP11");
    } else {
      setSelectedLevelCode("SC1");
    }
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
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback cho trình duyệt không cấp quyền Clipboard API.
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        if (!ok) throw new Error("copy bị từ chối");
      }
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
    <section id="pricing" className="py-20 bg-brand-800 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
            Đăng ký trực tuyến • Xếp lịch linh hoạt tại 5 cơ sở
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Chọn Khóa Học &amp; Giữ Chỗ Cho Bé
          </h2>
          <p className="text-brand-100 mt-3 text-base">
            Phụ huynh chọn cơ sở gần nhất và cấp độ học. Hệ thống tự động tính học phí và tạo mã VietQR tương ứng.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-card p-7 flex flex-col justify-between border transition ${
                pkg.popular
                  ? "bg-brand-700 border-amber-500 shadow-2xl shadow-amber-500/10 relative"
                  : "bg-brand-700/40 border-brand-600 hover:border-brand-500"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3.5 left-6 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-control uppercase tracking-wide">
                  Lộ trình tối ưu nhất
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                {/* min-h giữ cho hàng giá và danh sách quyền lợi thẳng hàng giữa 3 thẻ */}
                <p className="text-brand-200 text-sm mt-1.5 leading-relaxed min-h-10">
                  {pkg.subtitle}
                </p>

                <div className="my-5 pb-5 border-b border-brand-600">
                  <span className="text-3xl font-extrabold text-amber-400 tabular-nums">
                    {pkg.price.toLocaleString("vi-VN")}đ
                  </span>
                  <div className="text-brand-200 text-sm mt-1">{pkg.duration}</div>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-brand-100 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={(event) => handleOpenModal(pkg, event.currentTarget)}
                className={`w-full py-3.5 px-5 rounded-control font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98] ${
                  pkg.popular
                    ? "bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900"
                }`}
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                Chọn cơ sở &amp; Tạo mã QR
              </button>
            </div>
          ))}
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
              "Giáo trình chuẩn Global Chess kèm theo",
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
          className="fixed inset-0 z-50 bg-brand-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={DIALOG_TITLE_ID}
            className="bg-white text-slate-900 rounded-card max-w-xl w-full p-6 md:p-8 relative shadow-2xl my-8"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Đóng hộp thoại đăng ký"
              className="absolute top-4 right-4 p-1.5 rounded-control text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="mb-4 pr-10">
              {/* Badge tự động nhảy tên gói theo Cấp độ đăng ký */}
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-control">
                {activePackage.name}
              </span>
              <h3 id={DIALOG_TITLE_ID} className="text-xl font-bold mt-2">
                {showQR ? "Quét Mã VietQR Để Hoàn Tất Học Phí" : "Đăng Ký Cơ Sở & Khung Giờ Học"}
              </h3>
            </div>

            {!showQR ? (
              <form onSubmit={handleGenerateQR} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gc-child-name" className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ tên Học viên (Bé) *
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
                      Năm sinh / Tuổi (7-12 tuổi) *
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gc-parent-name" className="block text-sm font-semibold text-slate-700 mb-1">
                      Họ tên Phụ huynh *
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
                      <MapPin className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Chọn Cơ sở Global Chess *
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
                      Cấp độ / Khóa đăng ký *
                    </label>
                    <select
                      id="gc-level"
                      value={selectedLevelCode}
                      onChange={(e) => setSelectedLevelCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold border border-amber-400 rounded-control focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/40 text-slate-900"
                    >
                      {LEVEL_OPTIONS.map((lvl) => {
                        const pkgPrice = PRICING_PACKAGES.find((p) => p.id === lvl.packageId)?.price || 0;
                        return (
                          <option key={lvl.code} value={lvl.code}>
                            {lvl.label} — ({pkgPrice.toLocaleString("vi-VN")}đ)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Chọn các khung thời gian rảnh */}
                <fieldset>
                  <legend className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" /> Khung giờ bé có thể tham gia (Có thể chọn nhiều) *
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

                {/* Hộp hiển thị tổng tiền tự động cập nhật theo Cấp độ đăng ký */}
                <div className="bg-slate-50 p-3.5 rounded-control border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-600 font-medium">Học phí cần thanh toán:</div>
                    <div className="text-sm text-amber-700 font-semibold">{activeLevelObj.label}</div>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {activePackage.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:bg-brand-900 active:scale-[0.99] text-white font-bold rounded-control text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                  Tạo Mã VietQR ({activePackage.price.toLocaleString("vi-VN")}đ)
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-slate-50 p-3 rounded-control border border-slate-200 inline-block">
                  <img
                    src={qrUrl}
                    alt={`Mã VietQR thanh toán ${activePackage.price.toLocaleString("vi-VN")} đồng cho ${BRAND_INFO.name}`}
                    width={224}
                    height={224}
                    loading="lazy"
                    decoding="async"
                    className="w-56 h-auto mx-auto rounded-control"
                  />
                </div>

                <div className="text-left bg-amber-50/80 border border-amber-200 rounded-control p-3.5 text-sm space-y-1.5">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Học viên:</span>
                    <span className="font-bold text-slate-900 text-right">{childName} ({childAge})</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Cấp độ đăng ký:</span>
                    <span className="font-bold text-amber-800 text-right">{activeLevelObj.label}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-500 shrink-0">Số tiền học phí:</span>
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {activePackage.price.toLocaleString("vi-VN")}đ
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
                  Quét bằng bất kỳ App Ngân hàng nào để tự động điền đúng số tiền và cú pháp.
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQR(false)}
                    className="w-1/3 py-2.5 border border-slate-300 rounded-control text-sm font-semibold text-slate-600 hover:bg-slate-100 active:bg-slate-200 active:scale-[0.98] cursor-pointer transition"
                  >
                    Sửa thông tin
                  </button>
                  <a
                    href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white rounded-control text-sm font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    Đã chuyển khoản • Báo Zalo Trung tâm ({BRAND_INFO.hotlines[0]})
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
