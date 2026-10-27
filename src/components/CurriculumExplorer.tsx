// src/components/CurriculumExplorer.tsx
import { useState } from "react";
import { CURRICULUM_PROGRAMS, SESSION_TIMELINE } from "../data/courses";
import type { MajorProgram } from "../data/courses";
type ProgramStyle = {
  bar: string;
  barIdle: string;
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
    barIdle: "bg-brand-300",
    color: "#184268",
    tint: "#eef5fb",
    band: "bg-brand-50/70 border-brand-200/70",
    bandTitle: "text-brand-900",
    bandMeta: "text-brand-700",
    rule: "border-brand-800",
  },
  "so-cap": {
    bar: "bg-amber-700",
    barIdle: "bg-amber-300",
    color: "#b45309",
    tint: "#fdf6ea",
    band: "bg-amber-50/70 border-amber-200/70",
    bandTitle: "text-amber-900",
    bandMeta: "text-amber-800",
    rule: "border-amber-700",
  },
  "trung-cap": {
    bar: "bg-emerald-700",
    barIdle: "bg-emerald-300",
    color: "#047857",
    tint: "#eefaf4",
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

// Năm đoạn của một buổi học; số phút lấy từ SESSION_TIMELINE ("15 phút" → 15).
const SESSION_STEPS = SESSION_TIMELINE.map((step) => ({ ...step, minutes: parseInt(step.time, 10) }));
const SESSION_TOTAL = SESSION_STEPS.reduce((sum, step) => sum + step.minutes, 0);
// Đoạn thứ tư (thực hành bàn cờ) dùng màu cam để nổi bật.
const SESSION_COLORS = ["#2f6ba3", "#1f5285", "#184268", "#b45309", "#4d7fae"];

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
  const [openProgram, setOpenProgram] = useState<string | null>(CURRICULUM_PROGRAMS[0].id);

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

        {/* Nấc đang chọn: bìa sách, gáy màu theo khóa. Chỉ mục tiêu, không đổ cả giáo trình ra đây. */}
        <article
          className="gc-book mt-6"
          style={{ "--lc": selected.style.color } as React.CSSProperties}
          role="region"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="gc-book__spine">
            <span className="gc-book__code">{selected.code}</span>
            <span className="gc-book__prog">{SHORT_PROGRAM_NAMES[selected.program.id] ?? selected.program.title}</span>
          </div>
          <div className="gc-book__page">
            <h3 className="font-display text-[clamp(1.625rem,4.4vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-slate-900 text-balance max-w-[24ch]">
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
          <div className="gc-book__side" aria-hidden="true">
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
            Chi tiết giáo trình từng cấp độ
          </h3>
          <p className="mt-1 text-slate-500">
            Nội dung bài học và kết quả đạt được, theo tài liệu của trung tâm.
          </p>
          <div className="gc-idx mt-6">
            {CURRICULUM_PROGRAMS.map((program, index) => {
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
                    <span className="gc-idx__n tabular-nums">{String(index + 1).padStart(2, "0")}</span>
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

        {/* Cấu trúc chuẩn 1 buổi học: thanh tỉ lệ, bề rộng mỗi đoạn theo số phút. */}
        <div className="mt-16">
          <h3 className="font-display text-2xl font-extrabold tracking-[-0.015em] text-slate-900">
            Cấu trúc chuẩn mỗi buổi học
          </h3>
          <p className="mt-1 text-slate-500">Phương pháp sư phạm: Lý thuyết – Bài tập – Thực chiến</p>

          <div
            className="gc-strip mt-8"
            role="img"
            aria-label={`Một buổi ${SESSION_TOTAL} phút: ${SESSION_STEPS.map((step) => `${step.title} ${step.minutes} phút`).join(", ")}`}
          >
            {SESSION_STEPS.map((step, idx) => (
              <span key={idx} style={{ "--m": step.minutes, "--c": SESSION_COLORS[idx] } as React.CSSProperties}>
                {step.minutes}
                <small>′</small>
              </span>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>0</span>
            <span>{SESSION_TOTAL} phút</span>
          </div>

          <ol className="gc-strip-cols">
            {SESSION_STEPS.map((step, idx) => (
              <li key={idx} style={{ "--c": SESSION_COLORS[idx] } as React.CSSProperties}>
                <div>
                  <h4 className="font-display text-[1.0625rem] font-extrabold leading-tight tracking-[-0.01em] text-slate-900">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
