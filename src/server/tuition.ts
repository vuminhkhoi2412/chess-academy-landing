// src/server/tuition.ts
//
// Học phí và phụ phí chỉnh được trong quản trị. Giá khởi tạo nằm trong src/data/courses.ts
// (theo bảng giá PDF); bảng `tuition_prices` chỉ giữ những giá đã bị sửa, nên giá hiện hành
// = dòng trong DB nếu có, không thì giá khởi tạo. Mọi lần đổi giá ghi nhật ký cả giá cũ và mới.

import { EXTRA_FEES, TUITION_LEVELS, type ExtraFee, type TuitionLevel } from "../data/courses.ts";
import { audit, type Actor } from "./auth.ts";
import type { Db } from "./db.ts";
import { TUITION_POLICY } from "./policy.ts";

export class TuitionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const LEVEL_FIELDS = [
  { field: "group12", label: "Nhóm 12 buổi (1 buổi/tuần)" },
  { field: "group24", label: "Nhóm 24 buổi (2 buổi/tuần)" },
  { field: "oneOnOne", label: "1 kèm 1 (mỗi buổi)" },
  { field: "oneOnTwo", label: "1 kèm 2 (mỗi buổi)" },
] as const;

export type LevelField = (typeof LEVEL_FIELDS)[number]["field"];

export interface Tuition {
  levels: TuitionLevel[];
  extras: ExtraFee[];
}

export interface PriceChange {
  key: string;
  label: string;
  from: number;
  to: number;
}

const levelKey = (code: string, field: LevelField) => `${code}.${field}`;
const extraKey = (id: string) => `extra.${id}`;

/** Tên người đọc được của một khoá giá, dùng trong màn xác nhận và nhật ký. */
function labelOf(key: string): string {
  const [head, field] = key.split(".");
  if (head === "extra") return EXTRA_FEES.find((fee) => extraKey(fee.id) === key)?.label ?? key;
  return `${head} · ${LEVEL_FIELDS.find((f) => f.field === field)?.label ?? field}`;
}

function overrides(db: Db): Map<string, number> {
  const rows = db.prepare("SELECT key, amount FROM tuition_prices").all() as Array<{ key: string; amount: number }>;
  return new Map(rows.map((row) => [row.key, row.amount]));
}

/** Giá hiện hành: giá khởi tạo, đè bằng giá đã sửa trong DB. */
export function loadTuition(db: Db): Tuition {
  const saved = overrides(db);
  return {
    levels: TUITION_LEVELS.map((level) => {
      const next = { ...level };
      for (const { field } of LEVEL_FIELDS) next[field] = saved.get(levelKey(level.code, field)) ?? level[field];
      return next;
    }),
    extras: EXTRA_FEES.map((fee) => ({ ...fee, amount: saved.get(extraKey(fee.id)) ?? fee.amount })),
  };
}

/** Mọi khoá giá theo thứ tự trên màn hình, kèm giá hiện hành. */
export function priceKeys(tuition: Tuition): Array<{ key: string; amount: number }> {
  return [
    ...tuition.levels.flatMap((level) => LEVEL_FIELDS.map(({ field }) => ({ key: levelKey(level.code, field), amount: level[field] }))),
    ...tuition.extras.map((fee) => ({ key: extraKey(fee.id), amount: fee.amount })),
  ];
}

/** "1.800.000", "1 800 000đ" → 1800000; không phải số nguyên dương thì null. */
function parseAmount(raw: string): number | null {
  const digits = raw.replace(/[.,\s]|đ$/g, "");
  return /^\d{1,12}$/.test(digits) ? Number(digits) : null;
}

/**
 * Kiểm tra giá nhập vào và trả về những giá thực sự đổi. `input` là khoá giá → chuỗi người dùng gõ;
 * khoá thiếu thì giữ giá hiện hành, khoá lạ bị bỏ qua. Ném TuitionError nếu có giá sai hoặc không có gì đổi.
 */
export function reviewPrices(db: Db, input: Record<string, string>): PriceChange[] {
  const current = loadTuition(db);
  const next = new Map(priceKeys(current).map(({ key, amount }) => [key, amount]));
  const before = new Map(next);

  for (const key of before.keys()) {
    if (!(key in input)) continue;
    const amount = parseAmount(String(input[key]));
    if (amount === null || amount < 1 || amount > TUITION_POLICY.maxPrice) {
      throw new TuitionError(
        "amount",
        `Giá "${labelOf(key)}" phải là số nguyên từ 1 đến ${TUITION_POLICY.maxPrice.toLocaleString("vi-VN")} đồng.`,
      );
    }
    next.set(key, amount);
  }

  // Chặn nhầm lẫn rõ ràng: gói 24 buổi rẻ hơn 12 buổi, hoặc 1 kèm 2 đắt hơn 1 kèm 1.
  for (const level of current.levels) {
    const get = (field: LevelField) => next.get(levelKey(level.code, field))!;
    if (get("group24") <= get("group12")) throw new TuitionError("order", `${level.code}: giá 24 buổi phải cao hơn giá 12 buổi.`);
    if (get("oneOnOne") <= get("oneOnTwo")) throw new TuitionError("order", `${level.code}: giá 1 kèm 1 phải cao hơn giá 1 kèm 2.`);
  }

  const changes = [...before]
    .filter(([key, from]) => next.get(key) !== from)
    .map(([key, from]) => ({ key, label: labelOf(key), from, to: next.get(key)! }));
  if (changes.length === 0) throw new TuitionError("unchanged", "Chưa có giá nào thay đổi.");
  return changes;
}

/** Lưu các giá đã đổi (cùng một giao dịch) và ghi nhật ký từng giá: cũ → mới. */
export function savePrices(db: Db, input: Record<string, string>, actor: Actor, now: number = Date.now()): PriceChange[] {
  const changes = reviewPrices(db, input);
  db.exec("BEGIN");
  try {
    const upsert = db.prepare(
      `INSERT INTO tuition_prices (key, amount, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET amount = excluded.amount, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    );
    for (const change of changes) {
      upsert.run(change.key, change.to, now, actor.username);
      audit(db, actor, "price_changed", change.label, { key: change.key, from: change.from, to: change.to }, now);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return changes;
}

/** Lần sửa gần nhất của từng khoá giá, để hiện "ai sửa, lúc nào" cạnh ô nhập. */
export function lastEdits(db: Db): Map<string, { at: number; by: string | null }> {
  const rows = db.prepare("SELECT key, updated_at, updated_by FROM tuition_prices").all() as Array<{
    key: string;
    updated_at: number;
    updated_by: string | null;
  }>;
  return new Map(rows.map((row) => [row.key, { at: row.updated_at, by: row.updated_by }]));
}
