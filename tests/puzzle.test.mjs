// tests/puzzle.test.mjs
// Chạy: npm test   (node --test, không cần cài thêm gì)
//
// Khoá bài đố ở đầu trang chủ: Trắng chiếu hết trong 2 nước, đáp án duy nhất, Đen chỉ có một nước đáp.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { INTERACTIVE_PUZZLE } from "../src/data/courses.ts";

const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const { fen, solution } = INTERACTIVE_PUZZLE;
const [key, reply, mate] = solution;

const play = (game, m) => game.move({ from: m.from, to: m.to, promotion: "q" });
const isMateIn1 = (game) =>
  game.moves({ verbose: true }).some((m) => {
    const g = new Chess(game.fen());
    g.move(m);
    return g.isCheckmate();
  });

test("FEN đọc được, không phải thế xuất phát, Trắng đi trước", () => {
  const game = new Chess(fen);
  assert.notEqual(game.fen(), STANDARD_START_FEN);
  assert.equal(game.turn(), "w");
});

test("ba nước trong lời giải đều hợp lệ khi đi lần lượt, và nước cuối là chiếu hết", () => {
  const game = new Chess(fen);
  assert.doesNotThrow(() => play(game, key));
  assert.doesNotThrow(() => play(game, reply));
  assert.doesNotThrow(() => play(game, mate));
  assert.equal(game.isCheckmate(), true);
});

test("không có chiếu hết trong 1 nước ở thế xuất phát (đúng là bài 2 nước)", () => {
  assert.equal(isMateIn1(new Chess(fen)), false);
});

test("sau nước đầu, Đen chỉ có đúng một nước hợp lệ và đó là nước đáp trong lời giải", () => {
  const game = new Chess(fen);
  play(game, key);
  const legal = game.moves({ verbose: true });
  assert.equal(legal.length, 1, "Đen phải bị ép: máy tự đi nước đáp nên không được có lựa chọn khác");
  assert.equal(legal[0].from, reply.from);
  assert.equal(legal[0].to, reply.to);
});

test("nước đầu là cách giải duy nhất: mọi nước khác của Trắng không ép được chiếu hết trong 2 nước", () => {
  const start = new Chess(fen);
  const winning = start.moves({ verbose: true }).filter((m) => {
    const a = new Chess(fen);
    a.move(m);
    if (a.isGameOver()) return false;
    const replies = a.moves({ verbose: true });
    return replies.every((r) => {
      const b = new Chess(a.fen());
      b.move(r);
      return isMateIn1(b);
    });
  });
  assert.equal(winning.length, 1, "bài đố phải có đáp án duy nhất");
  assert.equal(winning[0].from, key.from);
  assert.equal(winning[0].to, key.to);
});
