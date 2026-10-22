// src/components/CurriculumExplorer.tsx
import { useState } from "react";
import { CURRICULUM_PROGRAMS, SESSION_TIMELINE } from "../data/courses";
import {
  Check,
  CheckCircle2,
  Clock,
  Timer,
  Award,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function CurriculumExplorer() {
  const [activeProgramId, setActiveProgramId] = useState(CURRICULUM_PROGRAMS[0].id);
  const activeProgram = CURRICULUM_PROGRAMS.find((p) => p.id === activeProgramId) || CURRICULUM_PROGRAMS[0];
  // Lưới 3 cột chỉ dành cho lộ trình 3 cấp độ; lộ trình 2 cấp độ chia đôi cho đầy hàng.
  const subLevelCount = activeProgram.subLevels.length;

  return (
    <section id="curriculum" className="py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="gc-eyebrow">Hệ thống giáo trình bài bản</span>
          <h2 className="gc-section-title text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-3">
            Lộ Trình Đào Tạo
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-3 max-w-prose mx-auto">
            Happy Chess gồm 3 Level (72 buổi); Global Sơ cấp và Trung cấp mỗi lộ trình 48 buổi, chia thành các cấp độ nhỏ 24 buổi. Học viên nắm chắc từ luật chơi cơ bản đến các đòn chiến thuật trung – tàn cuộc nâng cao.
          </p>
        </div>

        {/* Tầng 1: Chọn Lộ Trình Lớn (Sơ Cấp vs Trung Cấp) */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {CURRICULUM_PROGRAMS.map((prog) => {
            const isActive = prog.id === activeProgramId;
            return (
              <button
                key={prog.id}
                type="button"
                onClick={() => setActiveProgramId(prog.id)}
                aria-pressed={isActive}
                className={`px-6 py-4 rounded-card font-bold text-left transition-all border-2 flex items-center gap-3 cursor-pointer active:scale-[0.99] ${
                  isActive
                    ? "bg-brand-800 text-white border-brand-800 shadow-xl"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:shadow-soft"
                }`}
              >
                <div>
                  <div className={`text-xs font-semibold ${isActive ? "text-amber-400" : "text-amber-700"}`}>
                    {prog.badge}
                  </div>
                  <div className="text-base md:text-lg">{prog.title}</div>
                </div>
                <ChevronRight className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-500"}`} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {/* Tổng quan Lộ trình đang chọn */}
        <div className="bg-white rounded-card p-6 md:p-8 border border-slate-200 shadow-soft mb-8">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-control">
                  <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  Tổng thời lượng: <span className="tabular-nums">{activeProgram.totalDuration}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-control">
                  <Timer className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {activeProgram.sessionLength}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{activeProgram.title}</h3>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mục tiêu khóa học:</p>
              <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
                {activeProgram.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-5 bg-amber-50/70 border border-amber-200/80 rounded-card p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Award className="w-4 h-4 text-amber-600" aria-hidden="true" /> Tiêu chí đánh giá theo giai đoạn
              </div>
              {activeProgram.evaluation.map((ev, idx) => (
                <div key={idx} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="font-bold text-amber-700">•</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tầng 2: Chi tiết từng cấp độ nhỏ (24 buổi / cấp độ) */}
        {/*
          Số cột ăn theo số cấp độ của lộ trình đang chọn: lộ trình 3 cấp độ chia ba
          cột, lộ trình 2 cấp độ chia đôi. Trước đây lộ trình 2 cấp độ vẫn dùng lưới
          ba cột nên hai thẻ chỉ chiếm 2/3 chiều rộng và chừa một khoảng trống lớn
          bên phải.

          Các thẻ giữ chiều cao bằng nhau (mặc định stretch của grid) để hàng thẻ
          thẳng hàng; phần "Kết quả đạt được" được justify-between đẩy xuống đáy nên
          mọi thẻ kết thúc ở cùng một mức.
        */}
        <div className={`grid md:grid-cols-2 gap-8 mb-14${subLevelCount >= 3 ? " lg:grid-cols-3" : ""}`}>
          {activeProgram.subLevels.map((sub, index) => (
            <div
              key={sub.code}
              className="bg-white rounded-card border border-slate-200 shadow-lifted overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top bar */}
                <div className="bg-brand-800 text-white p-6 lg:min-h-[12.5rem]">
                  {/*
                    min-h trên hàng nhãn: mô tả cấp độ ("Làm quen và nắm vững luật chơi")
                    dài ngắn khác nhau nên có thẻ xuống 2 dòng, có thẻ 1 dòng, làm dải
                    navy trên cùng cao thấp lệch nhau. Chặn sàn 2,5rem cho hàng này thì
                    mọi thẻ bắt đầu phần nội dung ở cùng một mức.

                    Còn min-h 12.5rem ở khung ngoài là cho lưới 3 cột ở đúng cỡ màn
                    hình lg hẹp (~1024px): khi đó thẻ chỉ rộng ~309px nên mục tiêu của
                    Level 1 xuống 3 dòng trong khi hai Level kia vẫn 2 dòng. Sàn này
                    giữ đáy dải navy thẳng hàng ở mọi bề rộng lg.
                  */}
                  <div className="flex items-start justify-between gap-2 min-h-[2.5rem] text-xs font-semibold text-amber-400 mb-1">
                    <span className="shrink-0">CHẶNG {index + 1} • {sub.duration}</span>
                    <span className="bg-brand-700 px-2.5 py-1 rounded-control text-brand-100 text-right tabular-nums">{sub.lessonCount}</span>
                  </div>
                  <h4 className="text-xl font-bold">{sub.name}</h4>
                  <p className="text-sm text-brand-200 mt-2 leading-relaxed">{sub.goal}</p>
                </div>

                {/* Danh sách bài học */}
                <div className="p-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Nội dung chi tiết:
                  </div>
                  {/* Hiển thị toàn bộ 24 buổi, không nhét vào hộp cuộn để không giấu nội dung. */}
                  <ul className="grid sm:grid-cols-2 gap-2 list-none">
                    {sub.syllabus.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col gap-1 text-sm p-2.5 rounded-control bg-slate-50 border border-slate-100"
                      >
                        <span className="self-start text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                          {item.label}
                        </span>
                        <span className="font-semibold text-slate-900 leading-relaxed">{item.topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Kết quả đạt được */}
              <div className="p-6 bg-emerald-50/50 border-t border-emerald-100">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Kết quả đạt được sau {sub.duration}:
                </div>
                <ul className="space-y-1.5 list-none">
                  {sub.outcomes.map((out, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Cấu trúc chuẩn 1 buổi học */}
        <div className="bg-brand-800 text-white rounded-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Phương pháp sư phạm</span>
              <h3 className="text-xl font-bold mt-0.5">Cấu Trúc Chuẩn Mỗi Buổi Học</h3>
            </div>
            <span className="text-sm text-brand-200 italic">Lý thuyết - Bài tập - Thực chiến</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SESSION_TIMELINE.map((step, idx) => (
              <div key={idx} className="bg-brand-700/60 border border-brand-600 rounded-card p-4 relative">
                <div className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-control mb-2 tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {step.time}
                </div>
                <h4 className="font-bold text-sm text-white mb-1">{step.title}</h4>
                <p className="text-sm text-brand-200 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}