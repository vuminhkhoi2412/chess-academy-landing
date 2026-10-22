// tests/curriculum.test.mjs
// Chạy: npm test   (node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM_PROGRAMS } from "../src/data/courses.ts";

const byId = (id) => CURRICULUM_PROGRAMS.find((p) => p.id === id);

test("có đủ 3 lộ trình lớn", () => {
  assert.equal(CURRICULUM_PROGRAMS.length, 3);
  assert.ok(byId("happy-chess"), "thiếu happy-chess");
  assert.ok(byId("so-cap"), "thiếu so-cap");
  assert.ok(byId("trung-cap"), "thiếu trung-cap");
});

test("Happy Chess: 72 buổi, 3 level × 24 buổi, tuổi 4–12", () => {
  const hc = byId("happy-chess");
  assert.match(hc.totalDuration, /72 buổi/);
  assert.match(hc.targetAudience, /4 – 12/);
  assert.equal(hc.subLevels.length, 3);
  assert.deepEqual(hc.subLevels.map((s) => s.code), ["HC1", "HC2", "HC3"]);
  for (const sub of hc.subLevels) {
    assert.equal(sub.duration, "24 buổi");
    assert.ok(sub.syllabus.length > 0, sub.code);
    assert.ok(sub.outcomes.length > 0, sub.code);
  }
});

test("Level 1 Happy Chess dạy nhận biết quân, nhập thành, phong cấp", () => {
  const syllabus = byId("happy-chess").subLevels[0].syllabus;
  const topics = syllabus.map((s) => s.topic).join(" | ");
  assert.match(topics, /Nhận biết và đi quân/);
  assert.match(topics, /Nhập thành/);
  assert.match(topics, /phong cấp/);
  assert.deepEqual(syllabus.map((s) => s.label), ["Bài 1", "Bài 2", "Bài 3", "Bài 4"]);
});

test("mỗi chương trình đều có bài học và kết quả", () => {
  for (const prog of CURRICULUM_PROGRAMS) {
    assert.ok(prog.objectives.length > 0, prog.id);
    assert.ok(prog.evaluation.length > 0, prog.id);
    for (const sub of prog.subLevels) {
      assert.ok(sub.syllabus.length > 0, sub.code);
      assert.ok(sub.outcomes.length > 0, sub.code);
      assert.ok(sub.duration.length > 0, sub.code);
    }
  }
});
