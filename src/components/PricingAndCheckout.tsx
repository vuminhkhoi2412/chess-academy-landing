// src/components/PricingAndCheckout.tsx
import { useState, type SyntheticEvent } from "react";
import {
  PRICING_PACKAGES,
  BRANCHES,
  FLEXIBLE_TIME_SLOTS,
  BRAND_INFO,
} from "../data/courses";
import { BANK_CONFIG } from "../data/payment";
import { Check, QrCode, ShieldCheck, X, Copy, CheckCircle, MapPin, Clock } from "lucide-react";

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

  // Tự động suy ra thông tin Cấp độ & Gói giá tiền dựa trên dropdown "Cấp độ đăng ký"
  const activeLevelObj =
    LEVEL_OPTIONS.find((lvl) => lvl.code === selectedLevelCode) || LEVEL_OPTIONS[0];

  const activePackage =
    PRICING_PACKAGES.find((pkg) => pkg.id === activeLevelObj.packageId) || PRICING_PACKAGES[0];

  const toggleSlot = (slot: string) => {
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

  // Cú pháp chuyển khoản chuẩn Kế toán: GC [Mã Cơ Sở] [Mã Cấp Độ] [Tên Bé] [SĐT]
  const cleanChildName = removeAccents(childName || "HOCVIEN").replace(/\s+/g, "");
  const transferMemo = `GC ${selectedBranch} ${selectedLevelCode} ${cleanChildName} ${phone}`;

  // Mã VietQR lấy trực tiếp số tiền từ activePackage.price (ăn theo Cấp độ đăng ký)
  const qrUrl = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.png?amount=${activePackage.price}&addInfo=${encodeURIComponent(transferMemo)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;

  // Khi bấm vào 1 trong 3 thẻ bên ngoài -> Chọn sẵn cấp độ mặc định của thẻ đó
  const handleOpenModal = (pkg: typeof PRICING_PACKAGES[0]) => {
    if (pkg.id === "lo-trinh-48") {
      setSelectedLevelCode("SCFULL");
    } else if (pkg.id === "kem-1-1") {
      setSelectedLevelCode("VIP11");
    } else {
      setSelectedLevelCode("SC1");
    }
    setShowQR(false);
    setIsModalOpen(true);
  };

  const handleGenerateQR = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      alert("Vui lòng chọn ít nhất 1 khung thời gian rảnh của bé để trung tâm xếp lớp!");
      return;
    }
    setShowQR(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentBranchObj = BRANCHES.find((b) => b.id === selectedBranch);

  return (
    <section id="pricing" className="py-20 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-amber-400 font-semibold text-sm uppercase tracking-wider">
            Đăng ký trực tuyến • Xếp lịch linh hoạt tại 5 cơ sở
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">
            Chọn Khóa Học & Giữ Chỗ Cho Bé
          </h2>
          <p className="text-slate-400 mt-3 text-sm">
            Phụ huynh chọn cơ sở gần nhất và cấp độ học. Hệ thống tự động tính học phí và tạo mã VietQR tương ứng.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl p-7 flex flex-col justify-between border transition ${
                pkg.popular
                  ? "bg-slate-800 border-amber-500 shadow-2xl shadow-amber-500/10 relative"
                  : "bg-slate-800/40 border-slate-700"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3.5 left-6 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Lộ trình tối ưu nhất
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{pkg.subtitle}</p>

                <div className="my-5 pb-5 border-b border-slate-700">
                  <span className="text-3xl font-extrabold text-amber-400">
                    {pkg.price.toLocaleString("vi-VN")}đ
                  </span>
                  <div className="text-slate-400 text-xs mt-1">{pkg.duration}</div>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleOpenModal(pkg)}
                className={`w-full py-3.5 px-5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
                  pkg.popular
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                    : "bg-white hover:bg-slate-100 text-slate-900"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Chọn cơ sở & Tạo mã QR
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Chọn Cơ Sở, Cấp Độ & VietQR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 md:p-8 relative shadow-2xl my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-4">
              {/* Badge tự động nhảy tên gói theo Cấp độ đăng ký */}
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-1 rounded-md">
                {activePackage.name}
              </span>
              <h3 className="text-xl font-bold mt-2">
                {showQR ? "Quét Mã VietQR Để Hoàn Tất Học Phí" : "Đăng Ký Cơ Sở & Khung Giờ Học"}
              </h3>
            </div>

            {!showQR ? (
              <form onSubmit={handleGenerateQR} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ tên Học viên (Bé) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Minh An"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Năm sinh / Tuổi (7-12 tuổi) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 2016 (10 tuổi)"
                      value={childAge}
                      onChange={(e) => setChildAge(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Họ tên Phụ huynh *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Chị Thảo"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại Zalo *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="VD: 0901234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Chọn Cơ sở & Cấp độ (Khi đổi Cấp độ, Giá tiền tự động đổi theo) */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" /> Chọn Cơ sở Global Chess *
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} - {b.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cấp độ / Khóa đăng ký *
                    </label>
                    <select
                      value={selectedLevelCode}
                      onChange={(e) => setSelectedLevelCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/40 text-slate-900"
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Khung giờ bé có thể tham gia (Có thể chọn nhiều) *
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {FLEXIBLE_TIME_SLOTS.map((slot) => {
                      const checked = selectedSlots.includes(slot);
                      return (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => toggleSlot(slot)}
                          className={`text-left text-xs p-2.5 rounded-lg border transition flex items-center gap-2 cursor-pointer ${
                            checked
                              ? "bg-amber-50 border-amber-500 text-slate-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              checked ? "bg-amber-500 border-amber-500 text-white" : "border-slate-400"
                            }`}
                          >
                            {checked && <Check className="w-3 h-3" />}
                          </div>
                          <span>{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hộp hiển thị tổng tiền tự động cập nhật theo Cấp độ đăng ký */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-600 font-medium">Học phí cần thanh toán:</div>
                    <div className="text-[11px] text-amber-700 font-semibold">{activeLevelObj.label}</div>
                  </div>
                  <span className="text-lg font-extrabold text-slate-900">
                    {activePackage.price.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  Tạo Mã VietQR ({activePackage.price.toLocaleString("vi-VN")}đ)
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 inline-block">
                  <img
                    src={qrUrl}
                    alt="Mã VietQR Global Chess"
                    className="w-56 h-auto mx-auto rounded-lg"
                  />
                </div>

                <div className="text-left bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Học viên:</span>
                    <span className="font-bold text-slate-900">{childName} ({childAge})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cấp độ đăng ký:</span>
                    <span className="font-bold text-amber-800">{activeLevelObj.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền học phí:</span>
                    <span className="font-extrabold text-emerald-700">
                      {activePackage.price.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cơ sở đăng ký:</span>
                    <span className="font-semibold text-slate-900">{currentBranchObj?.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khung giờ đã chọn:</span>
                    <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                      {selectedSlots.join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-amber-200">
                    <span className="text-slate-500">Nội dung CK tự động:</span>
                    <button
                      onClick={() => copyToClipboard(transferMemo)}
                      className="inline-flex items-center gap-1 font-mono font-bold text-amber-900 hover:underline cursor-pointer"
                    >
                      {transferMemo}
                      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Quét bằng bất kỳ App Ngân hàng nào để tự động điền đúng số tiền và cú pháp.
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowQR(false)}
                    className="w-1/3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Sửa thông tin
                  </button>
                  <a
                    href={`https://zalo.me/${BRAND_INFO.zaloPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
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