// src/server/image-cache.ts
// LRU trong RAM cho phản hồi của /_image: trang chủ chạy trên server nên ảnh được xử lý bằng sharp
// khi chạy; không có bộ nhớ đệm thì mỗi lượt xem tốn 0,4–1,5 giây CPU cho mỗi ảnh lớn.
import { IMAGE_CACHE_POLICY } from "./policy.ts";

export interface CachedImage {
  status: number;
  headers: Array<[string, string]>;
  body: Uint8Array;
}

export class ImageCache {
  #map = new Map<string, CachedImage>();
  #bytes = 0;
  #policy: typeof IMAGE_CACHE_POLICY;

  constructor(policy: typeof IMAGE_CACHE_POLICY = IMAGE_CACHE_POLICY) {
    this.#policy = policy;
  }

  get(key: string): CachedImage | undefined {
    const hit = this.#map.get(key);
    if (hit) {
      this.#map.delete(key);
      this.#map.set(key, hit); // đưa lên cuối = mới dùng gần nhất
    }
    return hit;
  }

  set(key: string, value: CachedImage): void {
    const size = value.body.byteLength;
    if (size > this.#policy.maxEntryBytes) return;
    const old = this.#map.get(key);
    if (old) {
      this.#bytes -= old.body.byteLength;
      this.#map.delete(key);
    }
    this.#map.set(key, value);
    this.#bytes += size;
    for (const [k, v] of this.#map) {
      if (this.#map.size <= this.#policy.maxEntries && this.#bytes <= this.#policy.maxTotalBytes) break;
      this.#map.delete(k);
      this.#bytes -= v.body.byteLength;
    }
  }

  get size(): number {
    return this.#map.size;
  }
  get bytes(): number {
    return this.#bytes;
  }
}
