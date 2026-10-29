// src/components/InteractivePuzzle.tsx
import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import confetti from "canvas-confetti";
import { RotateCcw, CheckCircle2 } from "lucide-react";
import { INTERACTIVE_PUZZLE } from "../data/courses";

// Thế cờ và nước giải nằm trong src/data/courses.ts để test được logic cờ.
const INITIAL_FEN = INTERACTIVE_PUZZLE.fen;
const SOLUTION = INTERACTIVE_PUZZLE.solution;

export default function InteractivePuzzle() {
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  const [status, setStatus] = useState<"playing" | "solved" | "wrong">("playing");
  const wrongTimer = useRef<number | undefined>(undefined);

  // The "wrong move" hint resets itself. Clear the timer if the island unmounts first.
  useEffect(() => () => window.clearTimeout(wrongTimer.current), []);

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    // Đã giải xong, hoặc thả ra ngoài bàn cờ
    if (status === "solved" || !targetSquare) return false;

    // Sai nước: trả quân về chỗ cũ, không đổi thế cờ
    if (sourceSquare !== SOLUTION.from || targetSquare !== SOLUTION.to) {
      setStatus("wrong");
      wrongTimer.current = window.setTimeout(
        () => setStatus((prev) => (prev === "wrong" ? "playing" : prev)),
        1400
      );
      return false;
    }

    // Đúng nước: áp dụng lên bản sao để không sửa state cũ
    try {
      const next = new Chess(game.fen());
      const move = next.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (!move) return false;

      setGame(next);
      setStatus("solved");
      // Confetti is decoration; skip it when the visitor asked for reduced motion.
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
      return true;
    } catch {
      return false;
    }
  }

  function resetPuzzle() {
    window.clearTimeout(wrongTimer.current);
    setGame(new Chess(INITIAL_FEN));
    setStatus("playing");
  }

  return (
    <div className="bg-white p-5 rounded-card shadow-lifted border border-slate-200 max-w-md mx-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[0.9375rem] leading-6 font-semibold tracking-[-0.005em] text-slate-700">Thử thách ngày hôm nay</span>
        <button
          type="button"
          onClick={resetPuzzle}
          className="inline-flex min-h-11 items-center gap-1 text-slate-500 hover:text-slate-800 active:scale-95 text-sm transition rounded-control px-2 py-1 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Chơi lại
        </button>
      </div>

      <h2 className="text-base font-bold text-slate-900 mb-1">
        Trắng đi trước: Làm sao để bắt Xe của Đen?
      </h2>
      <p className="text-sm text-slate-600 mb-3">
        Gợi ý: Kéo quân <strong>Mã trắng (ở ô g5)</strong> để tung đòn "Chĩa đôi".
      </p>

      <div
        role="group"
        aria-label="Bàn cờ tương tác: kéo quân Mã trắng từ ô g5 sang ô f7 để giải đố"
        className="w-full max-w-[340px] aspect-square mx-auto rounded-control overflow-hidden border-2 border-brand-900 shadow-inner"
      >
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            // Bàn cờ dùng đúng màu navy thương hiệu thay vì xám slate.
            darkSquareStyle: { backgroundColor: "var(--color-brand-600)" },
            lightSquareStyle: { backgroundColor: "var(--color-board-light)" },
          }}
        />
      </div>

      <div className="mt-3 min-h-[44px] flex items-center justify-center" role="status" aria-live="polite">
        {status === "playing" && (
          <p className="text-sm text-slate-500 italic">
            Hãy kéo và thả quân cờ trên bàn cờ để giải đố...
          </p>
        )}
        {status === "wrong" && (
          <p className="text-sm font-semibold text-red-600 animate-pulse motion-reduce:animate-none">
            Chưa chính xác rồi. Hãy thử tìm ô nào tấn công cùng lúc 2 mục tiêu nhé.
          </p>
        )}
        {status === "solved" && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-control w-full text-sm font-medium border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              <strong>Tuyệt vời!</strong> Đó chính là đòn <em>Chĩa Đôi (Fork)</em> trong Cấp độ Chiến thuật!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
