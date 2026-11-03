// Homepage hero: a live Gray–Scott reaction–diffusion field (Turing-type pattern formation).
// Two "morphogens" (U, V) diffuse and react; pointer movement injects V to perturb the pattern.
(() => {
  const canvas = document.getElementById("morphogen");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const DU = 1.0, DV = 0.5, F = 0.0545, K = 0.062, STEPS = 12;
  // mono palette (steel blue) so the gradient headline stays readable on top
  const STOPS = [[0, "#050a14"], [0.2, "#0a1c2e"], [0.45, "#1d4e6b"], [0.7, "#4f8fae"], [1, "#cfe8f3"]];
  const LUT = buildLUT(STOPS);

  let W, H, U, V, U2, V2, KX, img, running = false, visible = true, raf = 0;

  function buildLUT(stops) {
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const lut = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let j = 0;
      while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
      const [t0, c0] = stops[j], [t1, c1] = stops[j + 1];
      const a = (t - t0) / (t1 - t0), A = hex(c0), B = hex(c1);
      for (let c = 0; c < 3; c++) lut[i * 3 + c] = A[c] + (B[c] - A[c]) * a;
    }
    return lut;
  }

  function seed(x, y, r) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const xx = (x + dx + W) % W, yy = (y + dy + H) % H, i = yy * W + xx;
      V[i] = 1; U[i] = 0.5;
    }
  }

  function init() {
    const rect = canvas.getBoundingClientRect();
    W = 280;
    H = Math.max(80, Math.round(W * (rect.height / Math.max(1, rect.width))));
    canvas.width = W; canvas.height = H;
    const n = W * H;
    U = new Float32Array(n).fill(1); V = new Float32Array(n);
    U2 = new Float32Array(n); V2 = new Float32Array(n);
    img = ctx.createImageData(W, H);
    KX = new Float32Array(n).fill(K);
    // organizer-like seeds, biased to the right side (text sits on the left)
    for (let s = 0; s < 18; s++) {
      const portrait = H > W * 1.05;
      const x = Math.floor(W * (portrait ? Math.random() : 0.35 + 0.65 * Math.random()));
      const y = Math.floor(H * (portrait ? 0.3 * Math.random() : Math.random()));
      seed(x, y, 2 + Math.floor(Math.random() * 3));
    }
  }

  function step() {
    for (let y = 0; y < H; y++) {
      const ym = ((y - 1 + H) % H) * W, y0 = y * W, yp = ((y + 1) % H) * W;
      for (let x = 0; x < W; x++) {
        const xm = (x - 1 + W) % W, xp = (x + 1) % W, i = y0 + x, k = KX[i];
        const u = U[i], v = V[i];
        const lu = 0.2 * (U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x]) + 0.05 * (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]) - u;
        const lv = 0.2 * (V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x]) + 0.05 * (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]) - v;
        const uvv = u * v * v;
        U2[i] = u + DU * lu - uvv + F * (1 - u);
        V2[i] = v + DV * lv + uvv - (k + F) * v;
      }
    }
    [U, U2] = [U2, U]; [V, V2] = [V2, V];
  }

  function draw() {
    const d = img.data;
    for (let i = 0, n = W * H; i < n; i++) {
      const t = Math.min(255, Math.max(0, (V[i] * 2.7 - (1 - U[i]) * 0.25) * 255)) | 0;
      d[i * 4] = LUT[t * 3]; d[i * 4 + 1] = LUT[t * 3 + 1]; d[i * 4 + 2] = LUT[t * 3 + 2]; d[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop() {
    if (!running) return;
    for (let s = 0; s < STEPS; s++) step();
    draw();
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!running && visible && !reduce && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  init();
  if (reduce) { for (let s = 0; s < 3500; s++) step(); draw(); }
  else { for (let s = 0; s < 400; s++) step(); draw(); start(); }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // perturb the field with the pointer (works over the hero, including the text)
  const hero = canvas.closest(".hero") || canvas;
  let last = 0;
  hero.addEventListener("pointermove", (e) => {
    const now = performance.now();
    if (now - last < 24) return;
    last = now;
    const r = canvas.getBoundingClientRect();
    seed(Math.floor(((e.clientX - r.left) / r.width) * W), Math.floor(((e.clientY - r.top) / r.height) * H), 2);
    if (reduce) draw();
  });

  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { const was = running; stop(); init(); for (let s = 0; s < 400; s++) step(); draw(); if (was || !reduce) start(); }, 250);
  });
})();
