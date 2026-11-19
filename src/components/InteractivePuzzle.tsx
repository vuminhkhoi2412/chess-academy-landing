// src/components/InteractivePuzzle.tsx
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import confetti from "canvas-confetti";
import { RotateCcw, CheckCircle2, Crown, RefreshCw } from "lucide-react";
import { INTERACTIVE_PUZZLE } from "../data/courses";
import { playClack } from "../lib/clack";

// Thế cờ và nước giải nằm trong src/data/courses.ts để test được logic cờ.
// SOLUTION: Trắng, Đen (bắt buộc, máy tự đi), Trắng, ... kết thúc bằng nước chiếu hết của Trắng.
const INITIAL_FEN = INTERACTIVE_PUZZLE.fen;
const SOLUTION = INTERACTIVE_PUZZLE.solution;
const REPLY_DELAY_MS = 450;
const MOVES_TO_MATE = (SOLUTION.length + 1) / 2;

interface Props {
  /** card: thẻ trắng nhỏ (mặc định). panel: khung navy "Chess Challenge" cho trang chủ. */
  variant?: "card" | "panel";
}

export default function InteractivePuzzle({ variant = "card" }: Props) {
  const panel = variant === "panel";
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  // step: nước thứ mấy trong SOLUTION đang chờ người chơi (số chẵn); số lẻ là lúc máy đáp.
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"playing" | "wrong" | "replying" | "solved">("playing");
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  // Hẹn giờ tự dọn khi island bị gỡ.
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (status === "solved" || status === "replying" || !targetSquare) return false;

    const expected = SOLUTION[step];
    // Sai nước: trả quân về chỗ cũ, không đổi thế cờ
    if (sourceSquare !== expected.from || targetSquare !== expected.to) {
      setStatus("wrong");
      later(() => setStatus((prev) => (prev === "wrong" ? "playing" : prev)), 1400);
      return false;
    }

    // Đúng nước: áp dụng lên bản sao để không sửa state cũ
    try {
      const next = new Chess(game.fen());
      if (!next.move({ from: sourceSquare, to: targetSquare, promotion: "q" })) return false;
      setGame(next);
      playClack();

      if (step === SOLUTION.length - 1) {
        setStatus("solved");
        // Confetti is decoration; skip it when the visitor asked for reduced motion.
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
        }
        return true;
      }

      // Đen chỉ có đúng một nước đáp hợp lệ (test khoá điều này): máy tự đi.
      setStep(step + 1);
      setStatus("replying");
      const reply = SOLUTION[step + 1];
      later(() => {
        const after = new Chess(next.fen());
        after.move({ from: reply.from, to: reply.to, promotion: "q" });
        setGame(after);
        playClack();
        setStep(step + 2);
        setStatus("playing");
      }, REPLY_DELAY_MS);
      return true;
    } catch {
      return false;
    }
  }

  function resetPuzzle() {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setGame(new Chess(INITIAL_FEN));
    setStep(0);
    setStatus("playing");
  }

  const board = (
    <div
      className={`mx-auto grid w-full ${panel ? "max-w-[380px]" : "max-w-[320px]"} grid-cols-[1.125rem_minmax(0,1fr)] grid-rows-[auto_1.125rem] text-[0.6875rem] font-semibold leading-none ${panel ? "text-brand-100" : "text-slate-600"}`}
    >
      <div aria-hidden="true" className="flex flex-col items-center justify-around">
        {[8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div
        role="group"
        aria-label={`Bàn cờ tương tác: Trắng đi trước, chiếu hết Đen trong ${MOVES_TO_MATE} nước`}
        className={`aspect-square rounded-sm overflow-hidden border-2 shadow-inner ${panel ? "border-brand-950" : "border-brand-900"}`}
      >
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            showNotation: false,
            // Bàn cờ dùng đúng màu navy thương hiệu thay vì xám slate.
            darkSquareStyle: { backgroundColor: "var(--color-brand-600)" },
            lightSquareStyle: { backgroundColor: "var(--color-board-light)" },
          }}
        />
      </div>
      <div aria-hidden="true" className="col-start-2 flex items-center justify-around">
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
    </div>
  );

  const statusLine = (
    <div className="mt-2 flex min-h-9 items-center justify-center" role="status" aria-live="polite">
      {(status === "playing" || status === "replying") && (
        <p className={`text-sm font-medium ${panel ? "text-brand-100" : "text-slate-600"}`}>
          {status === "replying" ? "Đen đang đi…" : step === 0 ? "Trắng đi trước" : "Trắng đi tiếp"}
        </p>
      )}
      {status === "wrong" && (
        <p className={`text-sm font-semibold animate-pulse motion-reduce:animate-none ${panel ? "text-red-300" : "text-red-600"}`}>Chưa đúng, thử lại nhé.</p>
      )}
      {status === "solved" && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-control w-full text-sm font-semibold border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
          Chiếu hết! Bạn giải đúng rồi.
        </div>
      )}
    </div>
  );

  if (panel) {
    return (
      <div className="w-full rounded-2xl bg-brand-800 p-5 text-white shadow-lifted md:p-6">
        <div className="flex items-center gap-3">
          <Crown className="h-9 w-9 shrink-0 text-amber-400" aria-hidden="true" />
          <div>
            <h2 className="text-xl font-extrabold leading-tight">Chess Challenge</h2>
            <p className="text-sm text-brand-100">Thử thách trí tuệ mỗi ngày</p>
          </div>
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-slate-900">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="11" cy="13" r="8" />
            <circle cx="11" cy="13" r="4" />
            <circle cx="11" cy="13" r="0.75" fill="currentColor" />
            <path d="M11 13 L21 3" />
            <path d="M21 3 L21.4 6.4 M21 3 L17.6 2.6" />
          </svg>
          Chiếu hết trong {MOVES_TO_MATE} nước
        </p>
        <div className="mt-4">{board}</div>
        {statusLine}
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={resetPuzzle}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-brand-900 px-4 text-sm font-semibold text-brand-100 transition hover:bg-brand-950 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Chơi lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-soft border border-slate-200 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-[0.9375rem] leading-6 font-semibold text-slate-800">Chiếu hết trong {MOVES_TO_MATE} nước</h2>
        <button
          type="button"
          onClick={resetPuzzle}
          className="inline-flex min-h-11 items-center gap-1 text-slate-500 hover:text-slate-800 active:scale-95 text-sm transition rounded-control px-2 py-1 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Chơi lại
        </button>
      </div>

      {/* Lề tọa độ nằm ngoài bàn cờ để không che quân và ô. */}
      {board}
      {statusLine}
    </div>
  );
}
