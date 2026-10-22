// tests/tuition.test.mjs
// Chạy: npm test   (node --test)
//
// Khóa cứng bảng học phí theo file "Bảng học phí Global Chess các cơ sở.pdf"
// do trung tâm cung cấp. Nếu trung tâm đổi giá, sửa cả dữ liệu lẫn test này
// trong cùng một commit để không có chuyện giá trên web trôi khỏi bảng chính thức.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CURRICULUM_PROGRAMS,
  TUITION_LEVELS,
  TUITION_PROGRAMS,
} from "../src/data/courses.ts";

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
    ["happy-chess", "so-cap", "trung-cap"]
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
