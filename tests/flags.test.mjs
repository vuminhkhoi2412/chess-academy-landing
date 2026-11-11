// tests/flags.test.mjs
// Chạy: npm test   (node --test)
//
// Khóa hành vi bật/tắt tính năng: mặc định, lưu và ghi nhật ký, dòng thông báo, trang chủ vẫn dựng
// được khi DB hỏng, và mỗi cờ khai báo đều thật sự được trang chủ dùng (không có cờ "mồ côi").
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openDb } from "../src/server/db.ts";
import { SITE_POLICY } from "../src/server/policy.ts";
import { listAudit } from "../src/server/auth.ts";
import {
  CONFIRM_BEFORE_OFF,
  FLAG_DEFS,
  FlagError,
  defaultFlags,
  getBannerText,
  getFlags,
  listFlagStates,
  loadSiteConfig,
  setBannerText,
  setFlag,
} from "../src/server/flags.ts";

const actor = { id: 1, username: "quan.tri" };
const T0 = 1_800_000_000_000;

test("chưa chỉnh gì thì mọi tính năng ở mặc định: bật hết, riêng thông báo đầu trang tắt", () => {
  const db = openDb(":memory:");
  const flags = getFlags(db);
  assert.deepEqual(flags, defaultFlags());
  assert.equal(flags.banner, false);
  for (const def of FLAG_DEFS) if (def.key !== "banner") assert.equal(flags[def.key], true, def.key);
});

test("bật/tắt được lưu, nhớ người và giờ đổi, và không ảnh hưởng cờ khác", () => {
  const db = openDb(":memory:");
  setFlag(db, "gallery", false, actor, T0);
  const flags = getFlags(db);
  assert.equal(flags.gallery, false);
  assert.equal(flags.faq, true);
  const state = listFlagStates(db).find((s) => s.def.key === "gallery");
  assert.deepEqual([state.enabled, state.updatedAt, state.updatedBy], [false, T0, "quan.tri"]);
  setFlag(db, "gallery", true, actor, T0 + 1);
  assert.equal(getFlags(db).gallery, true);
});

test("cờ không có trong danh sách bị từ chối", () => {
  const db = openDb(":memory:");
  assert.throws(() => setFlag(db, "khong-co", false, actor), (e) => e instanceof FlagError && e.code === "unknown_flag");
});

test("nhật ký ghi ai bật/tắt gì, và đánh dấu khi bấm lại đúng trạng thái cũ", () => {
  const db = openDb(":memory:");
  setFlag(db, "enrolment", false, actor, T0);
  setFlag(db, "enrolment", false, actor, T0 + 1);
  const [again, first] = listAudit(db).filter((r) => r.action === "flag_changed");
  assert.deepEqual(first.detail, { enabled: false, changed: true });
  assert.deepEqual(again.detail, { enabled: false, changed: false });
  assert.equal(first.target, "enrolment");
  assert.equal(first.username, "quan.tri");
});

test("dòng thông báo: gộp khoảng trắng, giới hạn độ dài, giữ lại khi tắt cờ", () => {
  const db = openDb(":memory:");
  assert.equal(setBannerText(db, "  Nghỉ lễ\n\n 2/9   cả hệ thống  ", actor, T0), "Nghỉ lễ 2/9 cả hệ thống");
  assert.equal(getBannerText(db), "Nghỉ lễ 2/9 cả hệ thống");
  const tooLong = "a".repeat(SITE_POLICY.bannerMaxLength + 1);
  assert.throws(() => setBannerText(db, tooLong, actor), (e) => e.code === "too_long");
  assert.equal(setBannerText(db, "a".repeat(SITE_POLICY.bannerMaxLength), actor).length, SITE_POLICY.bannerMaxLength);
  assert.equal(getBannerText(db).length, SITE_POLICY.bannerMaxLength);
});

test("trang chủ chỉ hiện thông báo khi cờ bật VÀ có nội dung", () => {
  const db = openDb(":memory:");
  assert.equal(loadSiteConfig(() => db).banner, null);
  setBannerText(db, "Khai giảng lớp mới", actor, T0);
  assert.equal(loadSiteConfig(() => db).banner, null);
  setFlag(db, "banner", true, actor, T0);
  assert.equal(loadSiteConfig(() => db).banner, "Khai giảng lớp mới");
  setBannerText(db, "   ", actor, T0 + 1);
  assert.equal(loadSiteConfig(() => db).banner, null);
});

test("DB hỏng thì trang chủ vẫn dựng được với mặc định, không ném lỗi", () => {
  const originalError = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args);
  try {
    const config = loadSiteConfig(() => {
      throw new Error("disk I/O error");
    });
    assert.deepEqual(config, { flags: defaultFlags(), banner: null });
    assert.equal(logged.length, 1);
  } finally {
    console.error = originalError;
  }
});

test("chỉ form đăng ký cần xác nhận trước khi tắt, và nó là cờ có thật", () => {
  assert.deepEqual([...CONFIRM_BEFORE_OFF], ["enrolment"]);
  for (const key of CONFIRM_BEFORE_OFF) assert.ok(FLAG_DEFS.some((d) => d.key === key));
});

test("mỗi cờ khai báo đều được trang công khai đọc (không có cờ mồ côi)", () => {
  const publicSources = ["src/pages/index.astro", "src/components/PricingAndCheckout.tsx", "src/components/SiteHeader.astro"]
    .map((file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8"))
    .join("\n");
  for (const def of FLAG_DEFS) {
    // `banner` được trang chủ đọc qua `banner` đã gộp nội dung, các cờ khác qua `flags.<key>`.
    const used = def.key === "banner" ? /\bbanner\b/.test(publicSources) : publicSources.includes(`flags.${def.key}`);
    assert.ok(used, `cờ "${def.key}" không được trang công khai dùng`);
  }
});
