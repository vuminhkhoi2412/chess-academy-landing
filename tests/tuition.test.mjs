// tests/tuition.test.mjs
// Chạy: npm test   (node --test)
//
// Phần đầu khóa GIÁ KHỞI TẠO trong courses.ts theo bảng học phí PDF của trung tâm.
// Giá hiện hành do quản trị sửa trong DB (phần sau: đè lên giá khởi tạo, kiểm tra giá, nhật ký).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CURRICULUM_PROGRAMS,
  EXTRA_FEES,
  TUITION_LEVELS,
  TUITION_PROGRAMS,
  buildFaqs,
} from "../src/data/courses.ts";
import { openDb } from "../src/server/db.ts";
import { listAudit } from "../src/server/auth.ts";
import { TuitionError, loadTuition, reviewPrices, savePrices } from "../src/server/tuition.ts";

const byCode = (code) => TUITION_LEVELS.find((level) => level.code === code);

const pricesOf = (level) => ({
  group12: level.group12,
  group24: level.group24,
  oneOnOne: level.oneOnOne,
  oneOnTwo: level.oneOnTwo,
});

test("bảng học phí có đủ 7 cấp độ đang mở đăng ký", () => {
  assert.deepEqual(
    TUITION_LEVELS.map((level) => level.code),
    ["HC1", "HC2", "HC3", "SC1", "SC2", "TC1", "TC2"]
  );
});

test("mỗi cấp độ học phí khớp đúng một cấp độ trong giáo trình", () => {
  const curriculumCodes = CURRICULUM_PROGRAMS.flatMap((program) =>
    program.subLevels.map((sub) => sub.code)
  ).sort();
  const tuitionCodes = TUITION_LEVELS.map((level) => level.code).sort();
  assert.deepEqual(tuitionCodes, curriculumCodes);
});

test("Happy Chess: 1.800.000đ / 12 buổi, 2.700.000đ / 24 buổi", () => {
  for (const code of ["HC1", "HC2", "HC3"]) {
    const level = byCode(code);
    assert.equal(level.programId, "happy-chess", code);
    assert.deepEqual(pricesOf(level), {
      group12: 1800000,
      group24: 2700000,
      oneOnOne: 350000,
      oneOnTwo: 250000,
    });
    assert.equal(level.sessionLength, "60 phút");
  }
});

test("Global Sơ cấp: đúng bảng giá từng nhóm Global 1–2 và 3–4", () => {
  assert.deepEqual(pricesOf(byCode("SC1")), {
    group12: 2100000,
    group24: 3240000,
    oneOnOne: 400000,
    oneOnTwo: 300000,
  });
  assert.equal(byCode("SC1").sessionLength, "60 phút");

  assert.deepEqual(pricesOf(byCode("SC2")), {
    group12: 2700000,
    group24: 4860000,
    oneOnOne: 400000,
    oneOnTwo: 300000,
  });
  assert.equal(byCode("SC2").sessionLength, "90 phút");
});

test("Global Trung cấp: đúng bảng giá từng nhóm Global 5–6 và 7–8", () => {
  assert.deepEqual(pricesOf(byCode("TC1")), {
    group12: 3240000,
    group24: 5830000,
    oneOnOne: 450000,
    oneOnTwo: 350000,
  });
  assert.deepEqual(pricesOf(byCode("TC2")), {
    group12: 3888000,
    group24: 6996000,
    oneOnOne: 450000,
    oneOnTwo: 350000,
  });
  for (const code of ["TC1", "TC2"]) {
    assert.equal(byCode(code).sessionLength, "90 phút");
  }
});

test("mỗi cấp độ trỏ tới một chương trình có thẻ học phí và giá hợp lệ", () => {
  assert.equal(TUITION_PROGRAMS.length, 3);
  assert.deepEqual(
    TUITION_PROGRAMS.map((program) => program.id),
    ["happy-chess", "beginner", "intermediate"]
  );

  for (const level of TUITION_LEVELS) {
    assert.ok(
      TUITION_PROGRAMS.some((program) => program.id === level.programId),
      `${level.code} trỏ tới chương trình không tồn tại`
    );
    assert.ok(level.group12 > 0, level.code);
    assert.ok(level.group24 > level.group12, level.code);
    assert.ok(level.oneOnOne > level.oneOnTwo, level.code);
    assert.ok(level.oneOnTwo > 0, level.code);
  }
});

test("thẻ học phí của mỗi chương trình tính được giá thấp nhất", () => {
  for (const program of TUITION_PROGRAMS) {
    const levels = TUITION_LEVELS.filter((level) => level.programId === program.id);
    assert.ok(levels.length > 0, program.id);
    for (const key of ["group12", "group24", "oneOnOne", "oneOnTwo"]) {
      const min = Math.min(...levels.map((level) => level[key]));
      assert.ok(min > 0, `${program.id}.${key}`);
    }
    assert.ok(program.features.length > 0, program.id);
  }
});

// ---- Giá hiện hành trong DB ----

const actor = { id: 1, username: "quantri" };
const T0 = 1_800_000_000_000;
const sc1 = (tuition) => tuition.levels.find((level) => level.code === "SC1");

test("DB trống: giá hiện hành đúng bằng giá khởi tạo (phụ phí cũng vậy)", () => {
  const tuition = loadTuition(openDb(":memory:"));
  assert.deepEqual(tuition.levels, TUITION_LEVELS);
  assert.deepEqual(tuition.extras, EXTRA_FEES);
});

test("sửa giá: chỉ giá đã đổi bị đè, nhận cả định dạng 3.240.000đ, và ghi nhật ký giá cũ → mới", () => {
  const db = openDb(":memory:");
  const changes = savePrices(db, { "SC1.group24": "3.500.000đ", "extra.uniform": "160000", "SC1.group12": "2100000" }, actor, T0);
  assert.deepEqual(changes.map((c) => [c.key, c.from, c.to]), [
    ["SC1.group24", 3240000, 3500000],
    ["extra.uniform", 150000, 160000],
  ]);
  const tuition = loadTuition(db);
  assert.equal(sc1(tuition).group24, 3500000);
  assert.equal(sc1(tuition).group12, 2100000);
  assert.equal(tuition.levels.find((l) => l.code === "HC1").group24, 2700000);
  assert.equal(tuition.extras.find((f) => f.id === "uniform").amount, 160000);

  const log = listAudit(db).filter((row) => row.action === "price_changed");
  assert.equal(log.length, 2);
  assert.deepEqual(log.find((row) => row.detail.key === "SC1.group24").detail, { key: "SC1.group24", from: 3240000, to: 3500000 });
  assert.equal(log[0].username, "quantri");

  // Sửa lần nữa: giá cũ trong nhật ký là giá hiện hành, không phải giá khởi tạo.
  savePrices(db, { "SC1.group24": "3600000" }, actor, T0 + 1);
  assert.equal(listAudit(db).find((row) => row.detail?.key === "SC1.group24").detail.from, 3500000);
});

test("giá sai bị từ chối và không lưu gì (kể cả giá đúng đi kèm)", () => {
  const db = openDb(":memory:");
  for (const bad of ["", "abc", "0", "-5", "12,5", "50000001", "1e6"]) {
    assert.throws(() => savePrices(db, { "HC1.group12": "1900000", "SC1.group24": bad }, actor, T0), TuitionError, bad);
  }
  assert.deepEqual(loadTuition(db).levels, TUITION_LEVELS);
  assert.equal(listAudit(db).filter((row) => row.action === "price_changed").length, 0);
});

test("chặn nhầm lẫn: 24 buổi không rẻ hơn 12 buổi, 1 kèm 2 không đắt hơn 1 kèm 1", () => {
  const db = openDb(":memory:");
  assert.throws(() => reviewPrices(db, { "HC1.group24": "1700000" }), /24 buổi phải cao hơn/);
  assert.throws(() => reviewPrices(db, { "HC1.oneOnTwo": "400000" }), /1 kèm 1 phải cao hơn/);
});

test("không có giá nào đổi thì báo, không ghi nhật ký", () => {
  const db = openDb(":memory:");
  assert.throws(() => savePrices(db, { "HC1.group12": "1.800.000" }, actor, T0), /Chưa có giá nào thay đổi/);
  assert.equal(listAudit(db).length, 0);
});

test("khoá lạ bị bỏ qua", () => {
  const db = openDb(":memory:");
  const changes = reviewPrices(db, { "XX9.group12": "5", "HC1.group12": "1900000" });
  assert.deepEqual(changes.map((c) => c.key), ["HC1.group12"]);
});

test("câu hỏi về phụ phí dùng giá hiện hành", () => {
  const db = openDb(":memory:");
  savePrices(db, { "extra.clock": "450000" }, actor, T0);
  const answer = buildFaqs(loadTuition(db).extras).find((item) => item.q.includes("bao gồm sách")).a;
  assert.match(answer, /đồng hồ thi đấu 450\.000đ/);
  assert.match(answer, /áo đồng phục 150\.000đ/);
});
