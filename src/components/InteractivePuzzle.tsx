// src/components/InteractivePuzzle.tsx
import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import confetti from "canvas-confetti";
import { Sparkles, RotateCcw, CheckCircle2 } from "lucide-react";
import { INTERACTIVE_PUZZLE } from "../data/courses";

// Thế cờ và nước giải nằm trong src/data/courses.ts để test được logic cờ.
const INITIAL_FEN = INTERACTIVE_PUZZLE.fen;
const SOLUTION = INTERACTIVE_PUZZLE.solution;

export default function InteractivePuzzle() {
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  const [status, setStatus] = useState<"playing" | "solved" | "wrong">("playing");

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    // Đã giải xong, hoặc thả ra ngoài bàn cờ
    if (status === "solved" || !targetSquare) return false;

    // Sai nước: trả quân về chỗ cũ, không đổi thế cờ
    if (sourceSquare !== SOLUTION.from || targetSquare !== SOLUTION.to) {
      setStatus("wrong");
      window.setTimeout(
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
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      return true;
    } catch {
      return false;
    }
  }

  function resetPuzzle() {
    setGame(new Chess(INITIAL_FEN));
    setStatus("playing");
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-200 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" /> Thử thách 10 giây cho bé
        </span>
        <button
          onClick={resetPuzzle}
          className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Chơi lại
        </button>
      </div>

      <h3 className="text-base font-bold text-slate-900 mb-1">
        Trắng đi trước: Làm sao để bắt Xe của Đen?
      </h3>
      <p className="text-xs text-slate-600 mb-3">
        Gợi ý: Kéo quân <strong>Mã trắng (ở ô g5)</strong> để tung đòn "Chĩa đôi"!
      </p>

      <div className="w-full max-w-[340px] aspect-square mx-auto rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner">
        <Chessboard
          options={{
            position: game.fen(),
            onPieceDrop: onDrop,
            darkSquareStyle: { backgroundColor: "#334155" },
            lightSquareStyle: { backgroundColor: "#f1f5f9" },
          }}
        />
      </div>

      <div className="mt-3 min-h-[44px] flex items-center justify-center">
        {status === "playing" && (
          <p className="text-xs text-slate-500 italic">
            Hãy kéo và thả quân cờ trên bàn cờ để giải đố...
          </p>
        )}
        {status === "wrong" && (
          <p className="text-xs font-semibold text-red-600 animate-pulse">
            Chưa chính xác rồi! Hãy thử tìm ô nào tấn công cùng lúc 2 mục tiêu nhé.
          </p>
        )}
        {status === "solved" && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg w-full text-xs font-medium border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>
              <strong>Tuyệt vời!</strong> Đó chính là đòn <em>Chĩa Đôi (Fork)</em> trong Cấp độ Chiến thuật!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
