// src/server/rate-limit.ts
// Cửa sổ trượt đếm theo khoá (IP). Nằm trong RAM: mất khi khởi động lại, đủ cho mục đích chặn lạm dụng.

export class RateLimiter {
  #hits = new Map<string, number[]>();
  #max: number;
  #windowMs: number;

  constructor(max: number, windowMs = 60_000) {
    this.#max = max;
    this.#windowMs = windowMs;
  }

  /** Ghi một lượt; trả về true nếu còn trong hạn mức, false nếu vượt. Lượt bị từ chối không được tính thêm. */
  take(key: string, now: number = Date.now()): boolean {
    const since = now - this.#windowMs;
    const recent = (this.#hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= this.#max) {
      this.#hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.#hits.set(key, recent);
    if (this.#hits.size > 5000) this.#sweep(since);
    return true;
  }

  #sweep(since: number): void {
    for (const [key, times] of this.#hits) {
      if (times.every((t) => t <= since)) this.#hits.delete(key);
    }
  }
}
