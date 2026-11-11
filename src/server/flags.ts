// src/server/flags.ts
//
// Các tính năng của trang chủ mà quản trị bật/tắt được, và nội dung dòng thông báo.
// Danh sách FLAG_DEFS là nguồn duy nhất: trang quản trị vẽ từ đây, trang chủ đọc theo `key`,
// và tests/flags.test.mjs kiểm tra mỗi `key` đều được trang chủ dùng thật.

import type { Actor } from "./auth.ts";
import { audit } from "./auth.ts";
import type { Db } from "./db.ts";
import { SITE_POLICY } from "./policy.ts";

export interface FlagDef {
  key: string;
  label: string;
  /** Câu một dòng cho nhân viên: tính năng này là gì. */
  description: string;
  /** Điều gì xảy ra trên trang khi TẮT, nói rõ cả những chỗ đi kèm bị ẩn. */
  whenOff: string;
  /** Giá trị khi chưa ai chỉnh, và cũng là giá trị dùng khi đọc DB bị lỗi. */
  default: boolean;
}

export const FLAG_DEFS = [
  {
    key: "banner",
    label: "Thông báo đầu trang",
    description: "Dải thông báo nổi bật ở trên cùng trang chủ (nghỉ lễ, khai giảng, đổi lịch...).",
    whenOff: "Dải thông báo biến mất. Nội dung đã soạn vẫn được giữ lại.",
    default: false,
  },
  {
    key: "puzzle",
    label: "Bàn cờ đố ở đầu trang",
    description: "Bàn cờ tương tác bên phải phần đầu trang (chỉ hiện trên máy tính và máy tính bảng).",
    whenOff: "Phần đầu trang không còn bàn cờ.",
    default: true,
  },
  {
    key: "testimonials",
    label: "Nhận xét của phụ huynh",
    description: "Phần nhận xét phụ huynh, kèm lời trích và ảnh các bé ở đầu trang.",
    whenOff: "Ẩn cả mục nhận xét lẫn lời trích và ảnh các bé ở đầu trang. Dùng khi phụ huynh rút lại đồng ý.",
    default: true,
  },
  {
    key: "gallery",
    label: "Hình ảnh lớp học",
    description: "Mục ảnh lớp học và giải đấu.",
    whenOff: "Ẩn cả mục ảnh.",
    default: true,
  },
  {
    key: "faq",
    label: "Câu hỏi thường gặp",
    description: "Mục hỏi đáp cuối trang.",
    whenOff: "Ẩn cả mục hỏi đáp.",
    default: true,
  },
  {
    key: "mobile_bar",
    label: "Thanh gọi và Zalo trên điện thoại",
    description: "Thanh cố định ở đáy màn hình điện thoại, có nút Gọi và nút Nhắn Zalo.",
    whenOff: "Điện thoại không còn thanh cố định; số hotline vẫn có ở đầu và cuối trang.",
    default: true,
  },
  {
    key: "enrolment",
    label: "Form đăng ký học thử",
    description: "Form đăng ký gửi thông tin về Google Sheet của trung tâm.",
    whenOff:
      "Ẩn hẳn form, các nút \"Đăng ký ngay\" và \"Chọn cơ sở này\". Nút đầu trang đổi thành \"Xem học phí\". Phụ huynh vẫn thấy học phí và hotline.",
    default: true,
  },
] as const satisfies readonly FlagDef[];

export type FlagKey = (typeof FLAG_DEFS)[number]["key"];
export type Flags = Record<FlagKey, boolean>;

/** Tính năng cần màn hình xác nhận trước khi TẮT vì ảnh hưởng trực tiếp đến việc nhận học viên. */
export const CONFIRM_BEFORE_OFF: readonly FlagKey[] = ["enrolment"];

export function isFlagKey(value: string): value is FlagKey {
  return FLAG_DEFS.some((def) => def.key === value);
}

export function defaultFlags(): Flags {
  return Object.fromEntries(FLAG_DEFS.map((def) => [def.key, def.default])) as Flags;
}

export interface FlagState {
  def: FlagDef;
  enabled: boolean;
  updatedAt: number | null;
  updatedBy: string | null;
}

export function listFlagStates(db: Db): FlagState[] {
  const rows = db.prepare("SELECT key, enabled, updated_at, updated_by FROM feature_flags").all() as Array<{
    key: string;
    enabled: number;
    updated_at: number;
    updated_by: string | null;
  }>;
  const stored = new Map(rows.map((row) => [row.key, row]));
  return FLAG_DEFS.map((def) => {
    const row = stored.get(def.key);
    return {
      def,
      enabled: row ? row.enabled === 1 : def.default,
      updatedAt: row?.updated_at ?? null,
      updatedBy: row?.updated_by ?? null,
    };
  });
}

export function getFlags(db: Db): Flags {
  const flags = defaultFlags();
  for (const state of listFlagStates(db)) flags[state.def.key as FlagKey] = state.enabled;
  return flags;
}

export class FlagError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function setFlag(db: Db, key: string, enabled: boolean, actor: Actor, now: number = Date.now()): void {
  if (!isFlagKey(key)) throw new FlagError("unknown_flag", "Tính năng này không tồn tại.");
  const before = listFlagStates(db).find((state) => state.def.key === key)!.enabled;
  db.prepare(
    `INSERT INTO feature_flags (key, enabled, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).run(key, enabled ? 1 : 0, now, actor.username);
  // Ghi cả khi bấm lại đúng trạng thái cũ: để biết ai đã bấm, nhưng đánh dấu là không đổi.
  audit(db, actor, "flag_changed", key, { enabled, changed: before !== enabled }, now);
}

// ---------- Dòng thông báo ----------

const BANNER_KEY = "banner_text";

export function getBannerText(db: Db): string {
  const row = db.prepare("SELECT value FROM site_settings WHERE key = ?").get(BANNER_KEY) as
    | { value: string }
    | undefined;
  return row?.value ?? "";
}

export function setBannerText(db: Db, raw: string, actor: Actor, now: number = Date.now()): string {
  // Gộp mọi khoảng trắng và xuống dòng thành một dấu cách: thông báo là một dòng.
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length > SITE_POLICY.bannerMaxLength) {
    throw new FlagError("too_long", `Thông báo tối đa ${SITE_POLICY.bannerMaxLength} ký tự (hiện ${text.length}).`);
  }
  db.prepare(
    `INSERT INTO site_settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
  ).run(BANNER_KEY, text, now, actor.username);
  audit(db, actor, "banner_text_changed", null, { text }, now);
  return text;
}

// ---------- Cho trang công khai ----------

export interface SiteConfig {
  flags: Flags;
  /** Nội dung dải thông báo cần hiện, hoặc null khi cờ tắt hoặc chưa có nội dung. */
  banner: string | null;
}

/**
 * Cấu hình trang chủ đọc ở mỗi request. DB hỏng hay thiếu file thì trang vẫn dựng được với mặc
 * định, không trả lỗi 500 cho phụ huynh; lỗi được ghi ra log của server để người vận hành thấy.
 */
export function loadSiteConfig(open: () => Db): SiteConfig {
  try {
    const db = open();
    const flags = getFlags(db);
    const text = getBannerText(db);
    return { flags, banner: flags.banner && text !== "" ? text : null };
  } catch (error) {
    console.error("[site-config] không đọc được cấu hình, dùng mặc định:", error);
    return { flags: defaultFlags(), banner: null };
  }
}
