// src/components/CurriculumExplorer.tsx
import { useState } from "react";
import { CURRICULUM_PROGRAMS } from "../data/courses";
import type { MajorProgram } from "../data/courses";
import PieceIcon from "./PieceIcon";
type ProgramStyle = {
  bar: string;
  color: string;
  tint: string;
  band: string;
  bandTitle: string;
  bandMeta: string;
  rule: string;
};

const PROGRAM_STYLES: Record<string, ProgramStyle> = {
  "happy-chess": {
    bar: "bg-brand-800",
    color: "#184268",
    tint: "#eef5fb",
    band: "bg-brand-50/70 border-brand-200/70",
    bandTitle: "text-brand-900",
    bandMeta: "text-brand-700",
    rule: "border-brand-800",
  },
  "so-cap": {
    bar: "bg-amber-700",
    color: "#b45309",
    tint: "#fdf6ea",
    band: "bg-amber-50/70 border-amber-200/70",
    bandTitle: "text-amber-900",
    bandMeta: "text-amber-800",
    rule: "border-amber-700",
  },
  "trung-cap": {
    bar: "bg-emerald-700",
    color: "#047857",
    tint: "#eefaf4",
    band: "bg-emerald-50/70 border-emerald-200/70",
    bandTitle: "text-emerald-900",
    bandMeta: "text-emerald-800",
    rule: "border-emerald-700",
  },
};

const FALLBACK_STYLE = PROGRAM_STYLES["happy-chess"];

// Tên ngắn của từng khóa, dùng trên gáy sách.
const SHORT_PROGRAM_NAMES: Record<string, string> = {
  "happy-chess": "Happy Chess",
  "so-cap": "Sơ cấp",
  "trung-cap": "Trung cấp",
};

/**
 * Bảy cấp độ theo thứ tự: HC1 → HC2 → HC3 → SC1 → SC2 → TC1 → TC2.
 * Thứ tự lấy nguyên theo CURRICULUM_PROGRAMS, nên không có danh sách thứ hai
 * phải giữ đồng bộ.
 */
const LEVELS = CURRICULUM_PROGRAMS.flatMap((program) =>
  program.subLevels.map((sub) => ({
    ...sub,
    program,
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

// Ba bước xếp lớp: phụ huynh không tự chọn cấp độ, giáo viên chốt sau ván thử.
const PLACEMENT_STEPS = [
  "Bé chơi thử một ván với giáo viên.",
  "Giáo viên chơi cùng, hỏi để hiểu và đánh giá trình độ.",
  "Giáo viên chốt cấp độ phù hợp với bé.",
];

/**
 * "Level 1 – Happy Chess 1" / "Global Chess Trung cấp – Quyển 1" → cấp độ lớn trước,
 * Level/Quyển sau. Dữ liệu giữ nguyên; chỉ đảo thứ tự khi hiển thị.
 */
function splitLevelName(name: string) {
  const [first, second = ""] = name.split(" – ");
  return /^(Level|Quyển)\s/.test(first) ? { major: second, minor: first } : { major: first, minor: second };
}

/** Happy Chess ghi một dòng "Happy Chess 1 - Level 1"; Sơ cấp và Trung cấp dài hơn nên xuống dòng, không cần dấu gạch. */
function LevelTitle({ name, programId }: { name: string; programId: string }) {
  const { major, minor } = splitLevelName(name);
  if (!minor) return <>{major}</>;
  return programId === "happy-chess" ? (
    <>
      {major} - {minor}
    </>
  ) : (
    <>
      {major}
      <span className="block">{minor}</span>
    </>
  );
}

export default function CurriculumExplorer() {
  const [selectedCode, setSelectedCode] = useState(LEVELS[0].code);
  const selected = LEVELS.find((level) => level.code === selectedCode) ?? LEVELS[0];
  // Chỉ một khóa mở tại một thời điểm; bấm khóa đang mở thì gập lại.
  const [openProgram, setOpenProgram] = useState<string | null>(null);

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
            Bảy cấp độ nối thành một lộ trình từ luật chơi cơ bản đến
            chiến thuật trung – tàn cuộc.</p>
        </div>

        {/* Chọn cấp độ: chip gom theo khóa, mỗi khóa một quân cờ (Tốt → Xe → Vua). */}
        <div className="grid gap-x-3 gap-y-5 sm:grid-cols-[3fr_2fr_2fr]">
          {CURRICULUM_PROGRAMS.map((program) => {
            const style = PROGRAM_STYLES[program.id] ?? FALLBACK_STYLE;
            return (
              <div key={program.id} className={`border-t-2 pt-2.5 ${style.rule}`}>
                <div className={`flex flex-wrap items-center justify-between gap-x-2 ${style.bandTitle}`}>
                  <span className="flex items-center gap-2 text-sm font-extrabold">
                    <PieceIcon programId={program.id} className="size-6 shrink-0" />
                    {program.title}
                  </span>
                  <span className={`text-xs ${style.bandMeta}`}>{bandMeta(program)}</span>
                </div>
                <ol className="mt-2.5 flex gap-1.5" aria-label={program.title}>
                  {LEVELS.filter((level) => level.program.id === program.id).map((level) => {
                    const isActive = level.code === selected.code;
                    return (
                      <li key={level.code} className="flex-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCode(level.code)}
                          aria-pressed={isActive}
                          className={`min-h-12 w-full cursor-pointer border px-2 py-2 font-display text-[15px] font-extrabold tracking-tight transition-colors ${
                            isActive
                              ? `${level.style.bar} border-transparent text-white`
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {level.code}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </div>

        {/* Nấc đang chọn: bìa sách, gáy màu theo khóa. Chỉ mục tiêu, không đổ cả giáo trình ra đây. */}
        <article
          className="gc-book mt-6"
          style={{ "--lc": selected.style.color } as React.CSSProperties}
          role="region"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="gc-book__spine">
            <span key={`code-${selected.code}`} className="gc-book__code">{selected.code}</span>
            <span key={`prog-${selected.code}`} className="gc-book__prog">{SHORT_PROGRAM_NAMES[selected.program.id] ?? selected.program.title}</span>
          </div>
          <div key={`page-${selected.code}`} className="gc-book__page">
            <h3 className="min-h-[2.16em] font-display text-[clamp(1.625rem,4.4vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-slate-900 text-balance max-w-[24ch]">
              <LevelTitle name={selected.name} programId={selected.program.id} />
            </h3>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
              <b className="font-bold text-slate-900 tabular-nums">{selected.duration}</b>
              <span>{selected.program.title}</span>
            </div>
            <p className="mt-6 max-w-[42ch] border-t border-slate-200 pt-5 text-lg leading-relaxed text-slate-700 text-pretty">
              {selected.goal}
            </p>
          </div>
          <div key={`side-${selected.code}`} className="gc-book__side" aria-hidden="true">
            <div className="gc-book__big tabular-nums">
              {parseInt(selected.duration, 10)}
              <small>buổi học trong cấp độ này</small>
            </div>
          </div>
        </article>

        {/* Cách xếp lớp: vé có đường xé. Phụ huynh không tự chọn cấp độ, giáo viên chốt sau ván thử. */}
        <div className="gc-ticket mt-8">
          <p className="gc-ticket__title">Cách xếp lớp</p>
          <ol className="gc-ticket__steps">
            {PLACEMENT_STEPS.map((step, i) => (
              <li key={step}>
                <b>{i + 1}</b>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="gc-ticket__note">Phụ huynh không cần tự chọn cấp độ.</p>
        </div>

        {/* Chi tiết giáo trình: bảng chỉ mục, gập sẵn để thang vẫn là phần chính. */}
        <div className="mt-16">
          <h3 className="font-display text-2xl font-extrabold tracking-[-0.015em] text-slate-900">
            Giáo trình chi tiết
          </h3>
          <p className="mt-1 text-slate-600">
            Nội dung bài học và kết quả đạt được sau từng cấp độ.
          </p>
          <div className="gc-idx mt-6">
            {CURRICULUM_PROGRAMS.map((program) => {
              const style = PROGRAM_STYLES[program.id] ?? FALLBACK_STYLE;
              return (
                <details
                  key={program.id}
                  open={openProgram === program.id}
                  style={{ "--lc": style.color, "--tint": style.tint } as React.CSSProperties}
                >
                  <summary
                    onClick={(event) => {
                      event.preventDefault();
                      setOpenProgram((current) => (current === program.id ? null : program.id));
                    }}
                  >
                    <PieceIcon programId={program.id} className="gc-idx__n" strokeWidth={1.75} />
                    <span className="gc-idx__title">
                      {program.title}
                      <small>{program.totalDuration}</small>
                    </span>
                    <span className="gc-idx__plus" aria-hidden="true" />
                  </summary>

                  <div className="gc-idx__cols" style={{ "--n": program.subLevels.length } as React.CSSProperties}>
                    {program.subLevels.map((sub) => (
                      <article key={sub.code}>
                        <h4>
                          <LevelTitle name={sub.name} programId={program.id} />
                        </h4>
                        <p className="gc-idx__goal">{sub.goal}</p>

                        <h5>Nội dung chi tiết</h5>
                        <ul>
                          {sub.syllabus.map((item, i) => (
                            <li key={i}>
                              <b className="tabular-nums">{item.label}</b>
                              <span>{item.topic}</span>
                            </li>
                          ))}
                        </ul>

                        <aside className="gc-outcome">
                          <h5>Kết quả sau {sub.duration}</h5>
                          <ul>
                            {sub.outcomes.map((outcome, i) => (
                              <li key={i}>{outcome}</li>
                            ))}
                          </ul>
                        </aside>
                      </article>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
