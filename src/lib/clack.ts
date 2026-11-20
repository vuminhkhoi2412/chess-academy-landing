// Tiếng đi quân: phát file public/sounds/move-self.mp3 (file rất nhỏ, ~3KB).
// Khởi tạo khi cần chứ không ở mức module, vì file này cũng được nạp lúc render phía server.
const SRC = "/sounds/move-self.mp3";
let base: HTMLAudioElement | undefined;

/** Nạp sẵn file để nước đi đầu tiên không bị trễ. */
export function preloadClack(): void {
  try {
    if (typeof Audio === "undefined" || base) return;
    base = new Audio(SRC);
    base.preload = "auto";
  } catch {
    // Âm thanh chỉ là phần thêm.
  }
}

export function playClack(): void {
  try {
    preloadClack();
    if (!base) return;
    // Phát bản sao để hai nước đi sát nhau không cắt tiếng của nhau.
    const sound = base.cloneNode(true) as HTMLAudioElement;
    void sound.play().catch(() => {
      // Trình duyệt chặn phát tự động hay thiếu file thì bỏ qua.
    });
  } catch {
    // Âm thanh chỉ là phần thêm; không hỗ trợ thì bỏ qua.
  }
}
