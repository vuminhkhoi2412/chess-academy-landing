// tests/puzzle.test.mjs
// Chạy: npm test   (node --test, không cần cài thêm gì)
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { INTERACTIVE_PUZZLE } from "../src/data/courses.ts";

const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const { fen, solution } = INTERACTIVE_PUZZLE;

const freshGame = () => new Chess(fen);

function pieces(game, color, type) {
  return game
    .board()
    .flat()
    .filter((p) => p && p.color === color && p.type === type)
    .map((p) => p.square);
}

test("FEN đọc được, và không phải thế xuất phát", () => {
  const game = freshGame();
  assert.notEqual(game.fen(), STANDARD_START_FEN, "bàn cờ đang rơi về thế xuất phát — đúng lỗi cũ");
  assert.equal(game.turn(), "w", "Trắng phải đi trước");
});

test("thế cờ khác thế xuất phát ở cả hai bên", () => {
  const start = new Chess(STANDARD_START_FEN);
  const game = freshGame();
  // Thế xuất phát: 16 quân mỗi bên, đủ 8 chốt. Thế đố phải khác.
  assert.notEqual(pieces(game, "w", "p").length, pieces(start, "w", "p").length);
  assert.notEqual(pieces(game, "b", "n").length, pieces(start, "b", "n").length);
});

test("ô xuất phát của nước giải có Mã Trắng", () => {
  const game = freshGame();
  const piece = game.get(solution.from);
  assert.ok(piece, `ô ${solution.from} phải có quân`);
  assert.equal(piece.type, "n");
  assert.equal(piece.color, "w");
});

test("nước giải là một nước ăn quân hợp lệ", () => {
  const game = freshGame();
  const target = game.get(solution.to);
  assert.ok(target, `ô ${solution.to} phải có quân để ăn`);
  assert.equal(target.color, "b");

  const legal = game.moves({ square: solution.from, verbose: true });
  assert.ok(
    legal.some((m) => m.to === solution.to),
    `${solution.from}->${solution.to} phải là nước hợp lệ`
  );
  assert.doesNotThrow(() => game.move({ from: solution.from, to: solution.to }));
});

test("sau nước giải, Đen bị chiếu", () => {
  const game = freshGame();
  game.move({ from: solution.from, to: solution.to });
  assert.equal(game.isCheck(), true, "nước giải phải là nước chiếu");
});

test("sau nước giải, quân vừa đi chĩa vào một Xe Đen (đòn chĩa đôi thật)", () => {
  const game = freshGame();
  game.move({ from: solution.from, to: solution.to });

  const rooks = pieces(game, "b", "r");
  assert.ok(rooks.length > 0, "Đen phải còn Xe để làm mục tiêu");

  const forked = rooks.filter((sq) => game.attackers(sq, "w").includes(solution.to));
  assert.ok(
    forked.length > 0,
    "quân ở " + solution.to + " phải tấn công ít nhất 1 Xe Đen, nếu không thì không phải chĩa đôi"
  );
});

test("Đen không bắt được quân vừa đi", () => {
  const game = freshGame();
  game.move({ from: solution.from, to: solution.to });

  const captures = game.moves({ verbose: true }).filter((m) => m.to === solution.to);
  assert.equal(
    captures.length,
    0,
    "Đen bắt lại được quân ở " + solution.to + " — đòn chĩa đôi vô hiệu"
  );
});

test("Đen vẫn còn nước hợp lệ (không phải chiếu hết)", () => {
  const game = freshGame();
  game.move({ from: solution.from, to: solution.to });
  assert.equal(game.isCheckmate(), false);
  assert.ok(game.moves().length > 0);
});

test("sau khi Đen tránh chiếu, Trắng ăn được Xe", () => {
  const game = freshGame();
  game.move({ from: solution.from, to: solution.to });
  game.move(game.moves()[0]);

  const rooks = pieces(game, "b", "r");
  const capturable = rooks.filter((sq) =>
    game.moves({ verbose: true }).some((m) => m.to === sq && m.from === solution.to)
  );
  assert.ok(capturable.length > 0, "sau nước tránh chiếu, Mã phải ăn được Xe");
});
