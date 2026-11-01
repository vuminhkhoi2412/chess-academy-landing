// Tiếng "cạch" của quân cờ gỗ đặt xuống bàn, tổng hợp bằng Web Audio nên không cần tải file âm thanh.
// Ba lớp, đều ngắn và sáng: tiếng gõ chính, tiếng nảy nhỏ ngay sau đó (đế quân chạm mặt bàn) và một thân gỗ mỏng.
// Cố ý không có âm trầm: dưới ~300Hz sẽ nghe như tiếng "bịch" thay vì "cạch".
let ctx: AudioContext | undefined;

function tick(c: AudioContext, at: number, ms: number, freq: number, q: number, gain: number, decay: number) {
  const len = Math.floor(c.sampleRate * (ms / 1000));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp((-i / len) * decay);
  const src = c.createBufferSource();
  src.buffer = buf;
  const band = c.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(band).connect(g).connect(c.destination);
  src.start(at);
}

export function playClack(): void {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();

    const t = ctx.currentTime;
    const j = 0.94 + Math.random() * 0.12; // mỗi nước hơi khác một chút cho đỡ máy móc

    tick(ctx, t, 28, 2900 * j, 1.8, 1.4, 8); // tiếng gõ chính, sắc
    tick(ctx, t + 0.013, 22, 1500 * j, 1.4, 0.7, 7); // nảy nhỏ ngay sau

    // Thân gỗ mỏng: sóng sin trung, tụt nhanh, tắt trong ~45ms.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(620 * j, t);
    osc.frequency.exponentialRampToValueAtTime(300 * j, t + 0.04);
    const body = ctx.createGain();
    body.gain.setValueAtTime(0.28, t);
    body.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(body).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  } catch {
    // Âm thanh chỉ là phần thêm; trình duyệt chặn hay không hỗ trợ thì bỏ qua.
  }
}
