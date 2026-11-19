// src/data/chess-engine.ts
// Mức độ của máy đối thủ trên bàn cờ trang chủ. Dùng chung cho trang quản trị (chọn mức, kiểm tra giá trị)
// và cho bàn cờ (ChessChallenge.tsx), nên không import gì từ server hay React.

export type EngineLevelId = "easy" | "medium" | "hard";
export type EngineSide = "w" | "b";

export interface EngineLevel {
  id: EngineLevelId;
  label: string;
  /** "Skill Level" của Stockfish (0–20). */
  skill: number;
  /** Thời gian nghĩ mỗi nước, mili giây. */
  ms: number;
  /** Mô tả một dòng cho nhân viên ở trang quản trị. */
  hint: string;
}

export const ENGINE_LEVELS: readonly EngineLevel[] = [
  { id: "easy", label: "Dễ", skill: 0, ms: 60, hint: "Máy hay đi sai, hợp với bé mới học." },
  { id: "medium", label: "Vừa", skill: 6, ms: 250, hint: "Máy chơi chắc tay, bé cần tính trước vài nước." },
  { id: "hard", label: "Khó", skill: 12, ms: 700, hint: "Máy chơi khá mạnh, người lớn cũng phải suy nghĩ." },
];

export const ENGINE_SIDES: readonly { id: EngineSide; label: string }[] = [
  { id: "w", label: "Trắng (đi trước)" },
  { id: "b", label: "Đen (máy đi trước)" },
];

export interface EngineSettings {
  level: EngineLevelId;
  /** Màu quân của người chơi. */
  side: EngineSide;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = { level: "easy", side: "w" };

export function isEngineLevel(value: string): value is EngineLevelId {
  return ENGINE_LEVELS.some((l) => l.id === value);
}

export function isEngineSide(value: string): value is EngineSide {
  return value === "w" || value === "b";
}
