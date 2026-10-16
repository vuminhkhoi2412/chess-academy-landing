// src/components/CurriculumExplorer.tsx
import { useState } from "react";
import { CURRICULUM_PROGRAMS, SESSION_TIMELINE } from "../data/courses";
import { BookOpen, CheckCircle2, Clock, Award, Sparkles, ChevronRight } from "lucide-react";

export default function CurriculumExplorer() {
  const [activeProgramId, setActiveProgramId] = useState(CURRICULUM_PROGRAMS[0].id);
  const activeProgram = CURRICULUM_PROGRAMS.find((p) => p.id === activeProgramId) || CURRICULUM_PROGRAMS[0];

  return (
    <section id="curriculum" className="py-20 bg-[#FAF8F5]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3.5 py-1.5 rounded-full">
            <BookOpen className="w-3.5 h-3.5" /> Hệ thống giáo trình bài bản
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mt-3">
            Lộ Trình Đào Tạo Global Chess (7 – 12 Tuổi)
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-2">
            Mỗi lộ trình gồm 48 buổi được chia thành 2 cấp độ nhỏ (24 buổi/cấp độ), giúp học viên nắm chắc từ nguyên lý khai cuộc đến các đòn chiến thuật trung – tàn cuộc nâng cao.
          </p>
        </div>

        {/* Tầng 1: Chọn Lộ Trình Lớn (Sơ Cấp vs Trung Cấp) */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {CURRICULUM_PROGRAMS.map((prog) => {
            const isActive = prog.id === activeProgramId;
            return (
              <button
                key={prog.id}
                onClick={() => setActiveProgramId(prog.id)}
                className={`px-6 py-4 rounded-2xl font-bold text-left transition-all border-2 flex items-center gap-3 ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl"
                    : "bg-white text-slate-700 border-slate-200 hover:border-amber-400"
                }`}
              >
                <div>
                  <div className={`text-xs font-semibold ${isActive ? "text-amber-400" : "text-amber-600"}`}>
                    {prog.badge}
                  </div>
                  <div className="text-base md:text-lg">{prog.title}</div>
                </div>
                <ChevronRight className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              </button>
            );
          })}
        </div>

        {/* Tổng quan Lộ trình đang chọn */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm mb-8">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="bg-slate-100 px-3 py-1 rounded-lg">⏱ Tổng thời lượng: {activeProgram.totalDuration}</span>
                <span className="bg-slate-100 px-3 py-1 rounded-lg">⌛ {activeProgram.sessionLength}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{activeProgram.title}</h3>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Mục tiêu khóa học:</p>
              <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
                {activeProgram.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-5 bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Award className="w-4 h-4 text-amber-600" /> Tiêu chí đánh giá theo giai đoạn
              </div>
              {activeProgram.evaluation.map((ev, idx) => (
                <div key={idx} className="text-xs text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="font-bold text-amber-600">•</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tầng 2: Chi tiết 2 Cấp độ nhỏ (24 buổi / cấp độ) */}
        <div className="grid md:grid-cols-2 gap-8 mb-14">
          {activeProgram.subLevels.map((sub, index) => (
            <div
              key={sub.code}
              className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top bar */}
                <div className="bg-slate-900 text-white p-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-400 mb-1">
                    <span>CHẶNG {index + 1} • {sub.duration}</span>
                    <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-200">{sub.lessonCount}</span>
                  </div>
                  <h4 className="text-xl font-bold">{sub.name}</h4>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{sub.goal}</p>
                </div>

                {/* Danh sách bài học */}
                <div className="p-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Nội dung chi tiết từng buổi / bài học:
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {sub.syllabus.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <span className="font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                          {item.label}
                        </span>
                        <span className="font-semibold text-slate-900 text-right ml-3">{item.topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kết quả đạt được */}
              <div className="p-6 bg-emerald-50/50 border-t border-emerald-100">
                <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Kết quả đạt được sau {sub.duration}:
                </div>
                <ul className="space-y-1.5">
                  {sub.outcomes.map((out, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Cấu trúc chuẩn 1 buổi học 60 - 90 phút */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Phương pháp sư phạm</span>
              <h3 className="text-xl font-bold mt-0.5">Cấu Trúc Chuẩn Mỗi Buổi Học (60 – 90 Phút)</h3>
            </div>
            <span className="text-xs text-slate-400">Đảm bảo cân bằng giữa Lý thuyết - Bài tập - Thực chiến</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SESSION_TIMELINE.map((step, idx) => (
              <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 relative">
                <div className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md mb-2">
                  <Clock className="w-3.5 h-3.5" /> {step.time}
                </div>
                <h4 className="font-bold text-sm text-white mb-1">{step.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}