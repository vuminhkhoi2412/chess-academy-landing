// tests/puzzle.test.mjs
// Chạy: npm test   (node --test, không cần cài thêm gì)
//
// Khoá bài đố ở đầu trang chủ: Trắng chiếu hết trong N nước, mỗi nước của Trắng là đáp án duy nhất
// và Đen luôn chỉ có một nước hợp lệ (vì máy tự đi nước Đen theo kịch bản).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { INTERACTIVE_PUZZLE } from "../src/data/courses.ts";

const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const { fen, solution } = INTERACTIVE_PUZZLE;
const movesToMate = (solution.length + 1) / 2;

const play = (game, m) => game.move({ from: m.from, to: m.to, promotion: "q" });

/** Các nước của Trắng ép chiếu hết trong n nước, bất kể Đen đáp thế nào. */
function winningMoves(f, n) {
  const start = new Chess(f);
  return start.moves({ verbose: true }).filter((m) => {
    const a = new Chess(f);
    a.move(m);
    if (a.isCheckmate()) return true;
    if (n === 1 || a.isGameOver()) return false;
    return a.moves({ verbose: true }).every((r) => {
      const b = new Chess(a.fen());
      b.move(r);
      return winningMoves(b.fen(), n - 1).length > 0;
    });
  });
}

test("FEN đọc được, không phải thế xuất phát, Trắng đi trước", () => {
  const game = new Chess(fen);
  assert.notEqual(game.fen(), STANDARD_START_FEN);
  assert.equal(game.turn(), "w");
});

test("lời giải có độ dài lẻ (Trắng đi cuối), đi lần lượt đều hợp lệ, nước cuối là chiếu hết", () => {
  assert.equal(solution.length % 2, 1);
  const game = new Chess(fen);
  for (const m of solution) assert.doesNotThrow(() => play(game, m));
  assert.equal(game.isCheckmate(), true);
});

test("không chiếu hết sớm hơn: Trắng không ép được chiếu hết trong ít nước hơn", () => {
  for (let n = 1; n < movesToMate; n++) assert.equal(winningMoves(fen, n).length, 0, `đã có chiếu hết trong ${n} nước`);
});

test("mỗi lượt Đen chỉ có đúng một nước hợp lệ, và đó là nước đáp trong lời giải", () => {
  const game = new Chess(fen);
  for (let i = 0; i < solution.length; i++) {
    if (i % 2 === 1) {
      const legal = game.moves({ verbose: true });
      assert.equal(legal.length, 1, `lượt Đen thứ ${(i + 1) / 2} phải bị ép: máy tự đi nên không được có lựa chọn khác`);
      assert.equal(legal[0].from, solution[i].from);
      assert.equal(legal[0].to, solution[i].to);
    }
    play(game, solution[i]);
  }
});

test("mỗi nước của Trắng là cách giải duy nhất ở lượt đó", () => {
  const game = new Chess(fen);
  for (let i = 0; i < solution.length; i += 2) {
    const left = (solution.length - i + 1) / 2;
    const winning = winningMoves(game.fen(), left);
    assert.equal(winning.length, 1, `nước thứ ${i / 2 + 1} của Trắng phải có đáp án duy nhất`);
    assert.equal(winning[0].from, solution[i].from);
    assert.equal(winning[0].to, solution[i].to);
    play(game, solution[i]);
    if (i + 1 < solution.length) play(game, solution[i + 1]);
  }
});
