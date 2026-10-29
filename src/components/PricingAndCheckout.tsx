// src/components/PricingAndCheckout.tsx
//
// Bảng học phí và form đăng ký học thử, cùng nằm trong dải navy `#pricing`. Các nút "Đăng ký ngay"
// ở bảng giá chỉ cuộn xuống form; form (EnrolmentForm) tự lo phần nhập, gửi và vé xác nhận.
import { TUITION_PROGRAMS, TUITION_LEVELS } from "../data/courses";
import { Check, ArrowRight } from "lucide-react";
import EnrolmentForm, { scrollToEnrolment } from "./EnrolmentForm";
import PieceIcon from "./PieceIcon";

export default function PricingAndCheckout() {
  return (
    <section id="pricing" className="relative overflow-hidden py-20 bg-brand-800 text-white">
      {/*
        Cùng ngôn ngữ hình khối với hero: một mặt phẳng bàn cờ tan dần ở rìa và một
        lớp hạt mịn. Dải navy này nằm giữa trang kem, nên nếu để phẳng nó đọc như
        một khối dán vào trang; lớp trang trí khiến nó thành một "màn đêm" có chủ đích.

        Lớp trang trí cố ý KHÔNG đặt z-index âm: z-index âm đẩy nó ra sau cả nền navy của section.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="gc-board-field gc-fade-radial absolute -left-28 -top-32 h-[34rem] w-[34rem] opacity-[0.18] [--gc-cell:3.5rem] [--gc-cell-color:var(--color-brand-600)]" />
        <div className="gc-grain absolute inset-0 opacity-[0.05]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="gc-section-title text-3xl md:text-4xl lg:text-5xl font-extrabold">
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
                        <span className="rounded-md bg-amber-500 px-2.5 py-0.5 font-sans text-xs font-bold text-slate-950">
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
                  <div className="text-xs font-semibold text-brand-200">
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
                  onClick={scrollToEnrolment}
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

        {/* Form đăng ký học thử đặt thẳng trên trang, ngay dưới bảng giá. Neo #dang-ky là chính form. */}
        <div className="mt-20">
          <div className="mb-8 max-w-2xl">
            <h3 className="gc-section-title text-2xl font-extrabold md:text-3xl lg:text-4xl">
              Đăng ký học thử miễn phí
            </h3>
          </div>
          <EnrolmentForm />
        </div>
      </div>

    </section>
  );
}
