// src/components/CurriculumExplorer.tsx
import { useState } from "react";
import { CURRICULUM_PROGRAMS, SESSION_TIMELINE } from "../data/courses";
import type { MajorProgram } from "../data/courses";
import {
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  Sparkles,
} from "lucide-react";

type ProgramStyle = {
  bar: string;
  barIdle: string;
  chip: string;
  band: string;
  bandTitle: string;
  bandMeta: string;
  rule: string;
};

const PROGRAM_STYLES: Record<string, ProgramStyle> = {
  "happy-chess": {
    bar: "bg-brand-800",
    barIdle: "bg-brand-300",
    chip: "bg-brand-50 text-brand-800 border-brand-200",
    band: "bg-brand-50/70 border-brand-200/70",
    bandTitle: "text-brand-900",
    bandMeta: "text-brand-700",
    rule: "border-brand-800",
  },
  "so-cap": {
    bar: "bg-amber-700",
    barIdle: "bg-amber-300",
    chip: "bg-amber-50 text-amber-800 border-amber-200",
    band: "bg-amber-50/70 border-amber-200/70",
    bandTitle: "text-amber-900",
    bandMeta: "text-amber-800",
    rule: "border-amber-700",
  },
  "trung-cap": {
    bar: "bg-emerald-700",
    barIdle: "bg-emerald-300",
    chip: "bg-emerald-50 text-emerald-800 border-emerald-200",
    band: "bg-emerald-50/70 border-emerald-200/70",
    bandTitle: "text-emerald-900",
    bandMeta: "text-emerald-800",
    rule: "border-emerald-700",
  },
};

const FALLBACK_STYLE = PROGRAM_STYLES["happy-chess"];

// Tên ngắn cho từng nấc thang. Sinh từ dữ liệu chứ không chép tay tên cấp độ,
// để đổi tên chương trình trong courses.ts là thang tự đổi theo.
const SHORT_PROGRAM_NAMES: Record<string, string> = {
  "happy-chess": "Happy Chess",
  "so-cap": "Sơ cấp",
  "trung-cap": "Trung cấp",
};

/**
 * Bảy nấc của một thang leo duy nhất: HC1 → HC2 → HC3 → SC1 → SC2 → TC1 → TC2.
 * Thứ tự lấy nguyên theo CURRICULUM_PROGRAMS, nên không có danh sách thứ hai
 * phải giữ đồng bộ.
 */
const LEVELS = CURRICULUM_PROGRAMS.flatMap((program) =>
  program.subLevels.map((sub, index) => ({
    ...sub,
    program,
    shortName: `${SHORT_PROGRAM_NAMES[program.id] ?? program.title} ${index + 1}`,
    style: PROGRAM_STYLES[program.id] ?? FALLBACK_STYLE,
  })),
);

/** "72 buổi (3 Level – …)" + "Trẻ từ 4 – 12 tuổi (…)" → "72 buổi · từ 4 tuổi". */
function bandMeta(program: MajorProgram): string {
  const sessions = program.totalDuration.match(/^(\d+)\s*buổi/);
  const age = program.targetAudience.match(/từ\s*(\d+)\s*(?:–|-)\s*\d+\s*tuổi/);
  return [sessions ? `${sessions[1]} buổi` : "", age ? `từ ${age[1]} tuổi` : ""]
    .filter(Boolean)
    .join(" · ");
}

export default function CurriculumExplorer() {
  const [selectedCode, setSelectedCode] = useState(LEVELS[0].code);
  const selected = LEVELS.find((level) => level.code === selectedCode) ?? LEVELS[0];

  return (
    <section id="curriculum" className="py-20 bg-cream">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="gc-eyebrow">Hệ thống giáo trình bài bản</span>
          <h2 className="gc-section-title text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mt-3">
            Lộ trình đào tạo
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-3 max-w-prose mx-auto">
            Bảy cấp độ, mỗi cấp 24 buổi, nối thành một lộ trình từ luật chơi cơ bản đến
            chiến thuật trung – tàn cuộc. Happy Chess dành cho bé từ 4 tuổi; Sơ cấp và
            Trung cấp từ 7 tuổi.
          </p>
        </div>

        {/* Thang leo: 7 nấc, thấp dần về bên trái. Trên điện thoại thang dựng đứng. */}
        <ol
          className="flex flex-col gap-2 md:flex-row md:items-end md:gap-2"
          aria-label="Bảy cấp độ trong lộ trình, từ Happy Chess 1 đến Trung cấp 2"
        >
          {LEVELS.map((level, index) => {
            const isActive = level.code === selected.code;
            return (
              <li key={level.code} className="md:min-w-0 md:flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedCode(level.code)}
                  aria-pressed={isActive}
                  className={`group flex w-full items-center gap-3 rounded-control border-2 p-3 text-left transition-all cursor-pointer active:scale-[0.99] md:flex-col md:items-stretch md:justify-end md:gap-0 md:rounded-none md:border-0 md:p-0 md:active:scale-100 ${
                    isActive
                      ? "border-brand-800 bg-white md:border-0 md:bg-transparent"
                      : "border-slate-200 bg-white/60 hover:border-amber-400 md:border-0 md:bg-transparent"
                  }`}
                >
                  {/* Nấc thang trên desktop: cột cao dần theo cấp độ. */}
                  <span
                    aria-hidden="true"
                    className={`hidden rounded-t-control md:flex md:items-end md:justify-center md:pb-2 transition-colors ${
                      isActive ? level.style.bar : level.style.barIdle
                    }`}
                    style={{ height: `${56 + index * 10}px` }}
                  >
                    <span
                      className={`text-xs font-extrabold tracking-wide ${
                        isActive ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {level.code}
                    </span>
                  </span>

                  {/* Vạch màu trên điện thoại, thay cho cột thang. */}
                  <span
                    aria-hidden="true"
                    className={`h-9 w-1.5 shrink-0 rounded-full md:hidden ${
                      isActive ? level.style.bar : level.style.barIdle
                    }`}
                  />

                  <span className="min-w-0 flex-1 md:mt-2 md:flex-none">
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-extrabold text-slate-700 md:hidden">
                        {level.code}
                      </span>
                      <span
                        className={`truncate text-[13px] font-bold lg:text-sm ${
                          isActive ? "text-slate-900" : "text-slate-700"
                        }`}
                      >
                        {level.shortName}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500 tabular-nums">
                      {level.duration}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* Dải chương trình: giữ danh tính của ba khóa mà thang vẫn là một đường. */}
        <div className="mt-3 grid gap-x-2 gap-y-3 sm:grid-cols-[3fr_2fr_2fr]">
          {CURRICULUM_PROGRAMS.map((program) => {
            const style = PROGRAM_STYLES[program.id] ?? FALLBACK_STYLE;
            return (
              <div key={program.id} className={`border-t-2 pt-2 ${style.rule}`}>
                <div className={`text-sm font-extrabold ${style.bandTitle}`}>{program.title}</div>
                <div className={`mt-0.5 text-xs ${style.bandMeta}`}>{bandMeta(program)}</div>
              </div>
            );
          })}
        </div>

        {/* Nấc đang chọn: chỉ mục tiêu, không đổ cả giáo trình ra đây. */}
        <div className="mt-6 grid gap-x-6 gap-y-2 rounded-card border border-slate-200 bg-white p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:p-6" role="region" aria-live="polite" aria-atomic="true">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={`rounded-control border px-2.5 py-1 text-xs font-bold ${selected.style.chip}`}>
                {selected.program.title}
              </span>
              <span className="text-sm font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                {selected.duration}
              </span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight tracking-tight text-slate-900 text-balance">
              {selected.name}
            </h3>
          </div>
          <p className="self-center text-base text-slate-700 leading-relaxed text-pretty">{selected.goal}</p>
        </div>

        {/* Cách xếp lớp: phụ huynh không tự chọn cấp độ, giáo viên chốt sau ván thử. */}
        <div className="mt-4 flex items-start gap-3 rounded-card border border-slate-200 bg-white p-4 md:p-5">
          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-slate-900">Cách xếp lớp</p>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Bé chơi thử một ván với giáo viên. Giáo viên chơi cùng, hỏi để hiểu và đánh
              giá trình độ, rồi chốt cấp độ phù hợp. Phụ huynh không cần tự chọn cấp độ.
            </p>
          </div>
        </div>

        {/* Chi tiết giáo trình: gập sẵn để thang vẫn là phần chính. */}
        <div className="mt-12">
          <h3 className="text-lg font-bold text-slate-900">Chi tiết giáo trình từng cấp độ</h3>
          <p className="mt-1 text-sm text-slate-600">
            Nội dung bài học và kết quả đạt được, theo tài liệu của trung tâm.
          </p>
          <div className="mt-4 space-y-2">
            {CURRICULUM_PROGRAMS.map((program) => (
              <details
                key={program.id}
                className="group rounded-card border border-slate-200 bg-white open:shadow-soft"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    {program.title}{" "}
                    <span className="font-normal text-slate-500">· {program.totalDuration}</span>
                  </span>
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>

                <div className="space-y-7 border-t border-slate-100 p-4 md:p-5">
                  {program.subLevels.map((sub) => (
                    <div key={sub.code}>
                      <h4 className="text-sm font-bold text-slate-900">{sub.name}</h4>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{sub.goal}</p>

                      <div className="mt-3">
                        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                          Nội dung chi tiết
                        </div>
                        <ul className="grid gap-1.5 list-none sm:grid-cols-2">
                          {sub.syllabus.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-700 tabular-nums">
                                {item.label}
                              </span>
                              <span className="leading-relaxed">{item.topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-900">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                          Kết quả đạt được sau {sub.duration}
                        </div>
                        <ul className="space-y-1 list-none">
                          {sub.outcomes.map((outcome, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                              <span className="leading-relaxed">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Cấu trúc chuẩn 1 buổi học */}
        <div className="mt-12 bg-brand-800 text-white rounded-card p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Phương pháp sư phạm</span>
              <h3 className="text-xl font-bold mt-0.5">Cấu trúc chuẩn mỗi buổi học</h3>
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
