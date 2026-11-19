// src/components/ChessChallenge.tsx
// Khung "Chess Challenge" ở trang chủ: khách đánh một ván với máy. Máy là Stockfish (WASM, bản lite một luồng)
// chạy trong Web Worker ngay trên trình duyệt, không cần server. File engine nằm ở public/engine/ và được giấy phép
// GPL-3.0 (public/engine/COPYING.txt). Giao tiếp theo giao thức UCI qua postMessage.
// Độ khó và màu quân do quản trị đặt (trang /admin/features), khách không đổi được.
import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import confetti from "canvas-confetti";
import { RefreshCw, Loader2, CheckCircle2, Handshake, Crown } from "lucide-react";
import { playClack } from "../lib/clack";
import { DEFAULT_ENGINE_SETTINGS, ENGINE_LEVELS, type EngineSettings } from "../data/chess-engine";

const ENGINE_URL = "/engine/stockfish-19-lite-single.js";

type Side = "w" | "b";
type Result = { kind: "win" | "loss" | "draw"; text: string } | null;

function resultOf(game: Chess, player: Side): Result {
  if (game.isCheckmate()) {
    // Bên đang đến lượt là bên bị chiếu hết.
    return game.turn() === player ? { kind: "loss", text: "Chiếu hết! Máy thắng ván này." } : { kind: "win", text: "Chiếu hết! Bạn thắng rồi, giỏi quá." };
  }
  if (game.isStalemate()) return { kind: "draw", text: "Hoà cờ: hết nước đi nhưng không bị chiếu." };
  if (game.isInsufficientMaterial()) return { kind: "draw", text: "Hoà cờ: không đủ quân để chiếu hết." };
  if (game.isThreefoldRepetition()) return { kind: "draw", text: "Hoà cờ: thế cờ lặp lại ba lần." };
  if (game.isDraw()) return { kind: "draw", text: "Hoà cờ: quá 50 nước không bắt quân hay đi tốt." };
  return null;
}

interface Props {
  engine?: EngineSettings;
}

export default function ChessChallenge({ engine: settings = DEFAULT_ENGINE_SETTINGS }: Props) {
  const player: Side = settings.side;
  const level = ENGINE_LEVELS.find((l) => l.id === settings.level) ?? ENGINE_LEVELS[0];
  const levelRef = useRef(level);
  levelRef.current = level;

  const [game, setGame] = useState(() => new Chess());
  const [engine, setEngine] = useState<"loading" | "ready" | "failed">("loading");
  const [thinking, setThinking] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  // Mỗi ván/lần đi lại tăng số này; câu trả lời cũ của engine (số thấp hơn) bị bỏ.
  const ticket = useRef(0);
  // Mỗi lệnh "go" gửi đi có đúng một "bestmove" trả về theo thứ tự (kể cả khi bị "stop"), nên giữ hàng đợi để ghép đúng cặp.
  const inflight = useRef<{ id: number; done: (move: string) => void }[]>([]);

  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker(ENGINE_URL);
    } catch {
      setEngine("failed");
      return;
    }
    workerRef.current = worker;
    worker.onerror = () => setEngine("failed");
    worker.onmessage = (ev: MessageEvent) => {
      const line = String(ev.data);
      if (line === "uciok") worker.postMessage("isready");
      else if (line === "readyok") setEngine((s) => (s === "loading" ? "ready" : s));
      else if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        const job = inflight.current.shift();
        if (job && job.id === ticket.current && move && move !== "(none)") job.done(move);
      }
    };
    worker.postMessage("uci");
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const askEngine = useCallback((fen: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    const mine = ++ticket.current;
    setThinking(true);
    const done = (best: string) => {
      setThinking(false);
      setGame((current) => {
        if (current.fen() !== fen) return current;
        const next = new Chess(fen);
        try {
          next.move({ from: best.slice(0, 2) as Square, to: best.slice(2, 4) as Square, promotion: best[4] ?? "q" });
        } catch {
          return current;
        }
        playClack();
        return next;
      });
    };
    inflight.current.push({ id: mine, done });
    worker.postMessage(`setoption name Skill Level value ${levelRef.current.skill}`);
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go movetime ${levelRef.current.ms}`);
  }, []);

  const result = resultOf(game, player);

  // Đến lượt máy (kể cả khi khách cầm Đen và máy đi nước đầu) thì hỏi engine.
  useEffect(() => {
    if (engine !== "ready" || result || game.turn() === player) return;
    askEngine(game.fen());
  }, [engine, game, player, result, askEngine]);

  // Kết thúc ván: pháo hoa nếu thắng.
  useEffect(() => {
    if (result?.kind === "win" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
    }
  }, [result?.kind]);

  function stopThinking() {
    ticket.current++;
    workerRef.current?.postMessage("stop");
    setThinking(false);
  }

  function newGame() {
    stopThinking();
    setGame(new Chess());
  }

  function onDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs) {
    if (!targetSquare || result || thinking || engine !== "ready" || game.turn() !== player) return false;
    try {
      const next = new Chess(game.fen());
      next.move({ from: sourceSquare as Square, to: targetSquare as Square, promotion: "q" });
      setGame(next);
      playClack();
      return true;
    } catch {
      return false;
    }
  }

  let status: string;
  if (engine === "failed") status = "Không tải được máy đối thủ. Tải lại trang hoặc thử trình duyệt khác nhé.";
  else if (engine === "loading") status = "Đang đánh thức máy đối thủ…";
  else if (result) status = result.text;
  else if (thinking) status = "Máy đang nghĩ…";
  else status = game.inCheck() ? "Bạn đang bị chiếu, hãy tránh nhé!" : "Đến lượt bạn";

  const lastMove = game.history({ verbose: true }).at(-1);
  const lastSquares: Record<string, { backgroundColor: string }> = lastMove
    ? { [lastMove.from]: { backgroundColor: "rgb(251 191 36 / 0.45)" }, [lastMove.to]: { backgroundColor: "rgb(251 191 36 / 0.45)" } }
    : {};

  return (
    <div className="w-full rounded-2xl bg-brand-800 p-5 text-white shadow-lifted md:p-6">
      <div className="flex items-center gap-3">
        <Crown className="h-9 w-9 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold leading-tight">Chess Challenge</h2>
          <p className="text-sm text-brand-100">Thử thách trí tuệ mỗi ngày</p>
        </div>
        <button
          type="button"
          onClick={newGame}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-amber-300 px-4 text-sm font-semibold text-slate-900 transition hover:bg-amber-200 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Ván mới
        </button>
      </div>

      <div className="mt-4">
        <div
          role="group"
          aria-label="Bàn cờ đấu với máy"
          className="mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-sm border-2 border-brand-950 shadow-inner"
        >
          <Chessboard
            options={{
              position: game.fen(),
              boardOrientation: player === "w" ? "white" : "black",
              onPieceDrop: onDrop,
              canDragPiece: ({ piece }) => !result && piece.pieceType[0] === player,
              squareStyles: lastSquares,
              darkSquareStyle: { backgroundColor: "var(--color-brand-600)" },
              lightSquareStyle: { backgroundColor: "var(--color-board-light)" },
            }}
          />
        </div>
      </div>

      <div className="mt-2 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold" role="status" aria-live="polite">
        {(engine === "loading" || thinking) && <Loader2 className="h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {result?.kind === "win" && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />}
        {result?.kind === "draw" && <Handshake className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />}
        <span className={engine === "failed" ? "text-red-300" : undefined}>{status}</span>
      </div>
    </div>
  );
}
