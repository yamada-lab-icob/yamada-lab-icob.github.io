// Homepage hero: self-organization of stem cells and synthetic organizer cells.
// Scattered single cells aggregate, then sort by differential adhesion into a programmed
// morphology. The program alternates between SHELL (organizers wrap the aggregate) and
// NODE (organizers form a single pole), inspired by Yamada et al., Cell 2025 (Video S1).
(() => {
  const canvas = document.getElementById("morphogen");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hero = canvas.closest(".hero") || canvas;
  const caption = document.querySelector("[data-hero-caption]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Adhesion "codes" (J[a][b]); type 0 = stem cell, type 1 = organizer cell.
  const PROGRAMS = [
    // cohesion = weak pull toward cells of the same type (strong homotypic affinity); 0 = none
    { name: "node", J: [[1.0, 0.18], [0.18, 1.0]], cohesion: [0.5, 1.5], text: "the organizers sort out into a single <strong>node</strong>" },
    { name: "shell", J: [[1.0, 0.75], [0.75, 0.3]], cohesion: [0.6, 0], text: "the organizers spread into a <strong>shell</strong> around the aggregate" },
  ];
  const ORGANIZER_FRACTION = 0.3;
  // Cell colors come from the active theme (themes.css: --cell-stem, --cell-org, …)
  const css = getComputedStyle(document.documentElement);
  const v = (name, fallback) => (css.getPropertyValue(name).trim().replace(/^"|"$/g, "") || fallback);
  const PAL = [
    { core: v("--cell-stem", "rgba(232,121,249,.92)"), glow: v("--cell-stem-glow", "rgba(167,139,250,.4)"), name: v("--cell-stem-name", "magenta") },
    { core: v("--cell-org", "rgba(120,236,255,1)"), glow: v("--cell-org-glow", "rgba(34,211,238,.5)"), name: v("--cell-org-name", "cyan") },
  ];
  const Q = new URLSearchParams(location.search);
  // Visual weight of the animation (0–1): kept low so the headline stays the focus. site.yml → hero.intensity
  const INTENSITY = Math.min(1, Math.max(0.1, parseFloat(Q.get("intensity") || canvas.dataset.intensity || "0.55")));
  // Simulation steps per frame: lower = slower, calmer motion. site.yml → hero.speed
  const SUBSTEPS = Math.max(1, parseInt(Q.get("speed") || canvas.dataset.speed || "2", 10));
  // phase lengths in simulation steps
  const T_ASSEMBLE = 2600, T_HOLD = 900, T_DISPERSE = 420;

  let W, H, dpr, cx, cy, R, r, N, xs, ys, fx, fy, rad, type, alpha = 0;
  let prog = 0, step = 0, running = false, visible = true, raf = 0;
  let pointer = null, sprites;

  const rand = (a, b) => a + Math.random() * (b - a);
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const smooth = (t) => { t = Math.min(1, Math.max(0, t)); return t * t * (3 - 2 * t); };

  function makeSprite(radius, core, glow) {
    const s = Math.ceil(radius * 2.2 * dpr);
    const c = document.createElement("canvas"); c.width = c.height = s;
    const g = c.getContext("2d"), m = s / 2;
    const grad = g.createRadialGradient(m, m, 0, m, m, m);
    grad.addColorStop(0, core); grad.addColorStop(0.42, core); grad.addColorStop(0.62, glow); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad; g.beginPath(); g.arc(m, m, m, 0, Math.PI * 2); g.fill();
    return c;
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const portrait = H > W * 1.05;
    if (portrait) {
      // phone: place the structure in the free space between the header and the text
      const kicker = document.querySelector(".hero-content .kicker");
      const textTop = kicker ? kicker.getBoundingClientRect().top - rect.top : H * 0.3;
      const top = 76;
      cx = W * 0.5; cy = (top + textTop) / 2;
      R = Math.max(40, Math.min((textTop - top) / 2 - 6, W * 0.32));
      N = 130;
    } else {
      cx = W * 0.76; cy = H * 0.5;
      R = Math.min(H * 0.25, W * 0.155);
      N = 300;
    }
    r = R / Math.sqrt(N / 0.82); // cell radius so N cells pack into radius R
    sprites = [
      makeSprite(r, PAL[0].core, PAL[0].glow),   // stem cells
      makeSprite(r, PAL[1].core, PAL[1].glow),   // organizers
    ];
  }

  function seed() {
    xs = new Float32Array(N); ys = new Float32Array(N); fx = new Float32Array(N); fy = new Float32Array(N);
    rad = new Float32Array(N); type = new Uint8Array(N);
    const portrait = H > W * 1.05;
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2), d = R * 1.9 * Math.sqrt(Math.random());
      // scatter in an ellipse: narrower toward the text side (left on desktop, below on phones)
      xs[i] = cx + Math.cos(a) * d * (portrait ? 1.25 : 0.85); ys[i] = cy + Math.sin(a) * d * (portrait ? 0.6 : 1.05);
      rad[i] = r * rand(0.85, 1.15);
      type[i] = Math.random() < ORGANIZER_FRACTION ? 1 : 0;
    }
    step = 0; alpha = 0;
    if (caption) caption.innerHTML = `Simulated self-organization: stem cells (${PAL[0].name}) and synthetic organizer cells (${PAL[1].name}). Programmed adhesion makes ${PROGRAMS[prog].text}.`;
  }

  function simulate() {
    const J = PROGRAMS[prog].J;
    const assembling = step < T_ASSEMBLE + T_HOLD;
    const progress = step / T_ASSEMBLE;
    const coh = PROGRAMS[prog].cohesion, cut2 = (2 * r * 1.15 * 1.45) ** 2;
    const noise = assembling ? r * (0.045 + 0.165 * (1 - smooth(progress))) : r * 0.2; // calm once assembled
    fx.fill(0); fy.fill(0);

    // pairwise contact forces: soft repulsion + type-dependent adhesion
    for (let i = 0; i < N; i++) {
      const xi = xs[i], yi = ys[i], ti = type[i], ri = rad[i];
      for (let j = i + 1; j < N; j++) {
        const dx = xs[j] - xi, dy = ys[j] - yi, dd = dx * dx + dy * dy;
        if (dd > cut2 || dd === 0) continue;
        const d = Math.sqrt(dd), d0 = ri + rad[j], cut = d0 * 1.45;
        if (d > cut) continue;
        let f;
        if (d < d0) f = -0.28 * (d0 - d);                                   // overlap → push apart
        else f = assembling ? 0.11 * r * J[ti][type[j]] * Math.sin(Math.PI * (d - d0) / (cut - d0)) : 0; // adhesion
        const ux = dx / d, uy = dy / d;
        fx[i] += f * ux; fy[i] += f * uy; fx[j] -= f * ux; fy[j] -= f * uy;
      }
    }

    // centroids per type (for homotypic cohesion)
    const sx = [0, 0], sy = [0, 0], sn = [0, 0];
    for (let i = 0; i < N; i++) { sx[type[i]] += xs[i]; sy[type[i]] += ys[i]; sn[type[i]]++; }
    const ramp = smooth((progress - 0.1) / 0.3);

    for (let i = 0; i < N; i++) {
      const dx = xs[i] - cx, dy = ys[i] - cy, d = Math.hypot(dx, dy) || 1;
      const t = type[i];
      if (assembling && coh[t] && sn[t]) {
        const ox = sx[t] / sn[t] - xs[i], oy = sy[t] / sn[t] - ys[i], od = Math.hypot(ox, oy) || 1;
        const k = r * 0.035 * coh[t] * ramp * Math.min(1, od / (R * 0.5));
        fx[i] += (ox / od) * k; fy[i] += (oy / od) * k;
      }
      if (assembling) {
        // the "well": strong pull while scattered, gentle once compact
        const pull = r * (0.012 + 0.11 * smooth((d - R * 0.9) / (R * 1.2)));
        fx[i] -= (dx / d) * pull; fy[i] -= (dy / d) * pull;
      } else {
        fx[i] += (dx / d) * r * 0.05; fy[i] += (dy / d) * r * 0.05;           // disperse
      }
      if (pointer) {
        const px = xs[i] - pointer.x, py = ys[i] - pointer.y, pd = Math.hypot(px, py), reach = R * 0.45;
        if (pd < reach && pd > 0) { const k = r * 0.5 * (1 - pd / reach); fx[i] += (px / pd) * k; fy[i] += (py / pd) * k; }
      }
      xs[i] += fx[i] + gauss() * noise;
      ys[i] += fy[i] + gauss() * noise;
    }

    step++;
    if (step < 160) alpha = step / 160;
    else if (!assembling) alpha = Math.max(0, 1 - (step - T_ASSEMBLE - T_HOLD) / T_DISPERSE);
    if (step >= T_ASSEMBLE + T_HOLD + T_DISPERSE) { prog = (prog + 1) % PROGRAMS.length; seed(); }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = alpha * INTENSITY;
    for (const t of [0, 1]) {               // organizers on top
      const sp = sprites[t], base = sp.width / r;   // sprite pixels per unit radius
      for (let i = 0; i < N; i++) if (type[i] === t) {
        const s = rad[i] * base, h = s / 2;
        ctx.drawImage(sp, xs[i] * dpr - h, ys[i] * dpr - h, s, s);
      }
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    for (let s = 0; s < SUBSTEPS; s++) simulate();
    draw();
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!running && visible && !reduce && !document.hidden) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  layout(); seed();
  if (reduce) { for (let s = 0; s < T_ASSEMBLE; s++) simulate(); alpha = 1; draw(); }
  else start();

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // poke the aggregate with the cursor or a finger
  const setPointer = (e) => { const b = canvas.getBoundingClientRect(); pointer = { x: e.clientX - b.left, y: e.clientY - b.top }; };
  hero.addEventListener("pointermove", setPointer);
  hero.addEventListener("pointerdown", setPointer);
  hero.addEventListener("pointerleave", () => (pointer = null));
  hero.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") pointer = null; });

  let rt, lastW = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const w = canvas.getBoundingClientRect().width;
      if (Math.abs(w - lastW) < 2) return;             // ignore mobile URL-bar height changes
      lastW = w; layout(); seed(); if (reduce) { for (let s = 0; s < T_ASSEMBLE; s++) simulate(); alpha = 1; draw(); }
    }, 250);
  });
  lastW = canvas.getBoundingClientRect().width;
})();
