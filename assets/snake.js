/* Snake that writes "E'TIBORINGIZ UCHUN RAHMAT!" with its trail, then becomes a playable game. */
(() => {
  const cv = document.getElementById("snake");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const W = 300, H = 190, BG = "#c7f0d8", INK = "#43523d", FAINT = "rgba(67,82,61,0.18)";
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lcdLeft = document.getElementById("lcdLeft"), lcdRight = document.getElementById("lcdRight");
  const hint = document.getElementById("gameHint");

  /* ---------- pixel font (variable width, 5 rows) ---------- */
  const F = {
    "E": ["111", "100", "111", "100", "111"], "'": ["1", "1", "0", "0", "0"],
    "T": ["111", "010", "010", "010", "010"], "I": ["111", "010", "010", "010", "111"],
    "B": ["110", "101", "110", "101", "110"], "O": ["111", "101", "101", "101", "111"],
    "R": ["110", "101", "110", "101", "101"], "N": ["1001", "1101", "1011", "1001", "1001"],
    "G": ["111", "100", "101", "101", "111"], "Z": ["111", "001", "010", "100", "111"],
    "U": ["101", "101", "101", "101", "111"], "C": ["111", "100", "100", "100", "111"],
    "H": ["101", "101", "111", "101", "101"], "A": ["010", "101", "111", "101", "101"],
    "M": ["10001", "11011", "10101", "10001", "10001"], "!": ["1", "1", "1", "0", "1"],
  };
  const LINES = ["E'TIBORINGIZ", "UCHUN", "RAHMAT!"];
  const C = 5, COLS = W / C, ROWS = Math.floor(H / C); // 60 x 38

  function buildTargets() {
    const lineH = 5, gap = 3, total = LINES.length * lineH + (LINES.length - 1) * gap;
    let y0 = Math.floor((ROWS - total) / 2);
    const order = [];
    LINES.forEach((line, li) => {
      const widths = [...line].map(ch => F[ch][0].length);
      const lw = widths.reduce((a, b) => a + b, 0) + (line.length - 1);
      let x = Math.floor((COLS - lw) / 2);
      const y = y0 + li * (lineH + gap);
      [...line].forEach((ch, ci) => {
        const g = F[ch], w = g[0].length;
        for (let cx = 0; cx < w; cx++) {
          const rows = [0, 1, 2, 3, 4];
          if (cx % 2) rows.reverse(); // serpentine inside each glyph
          rows.forEach(r => { if (g[r][cx] === "1") order.push([x + cx, y + r]); });
        }
        x += w + 1;
      });
    });
    return order;
  }
  const TARGETS = buildTargets();

  function pathThrough(points, start) {
    const steps = []; let [x, y] = start;
    for (const [tx, ty] of points) {
      while (x !== tx) { x += Math.sign(tx - x); steps.push([x, y, false]); }
      while (y !== ty) { y += Math.sign(ty - y); steps.push([x, y, false]); }
      if (steps.length && steps[steps.length - 1][0] === tx && steps[steps.length - 1][1] === ty) steps[steps.length - 1][2] = true;
      else steps.push([tx, ty, true]);
    }
    return steps;
  }

  function cell(x, y, color, size = C) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size + .5, y * size + .5, size - 1, size - 1);
  }
  function clear() { ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); }

  /* ---------- message mode ---------- */
  let mode = "idle", raf = null, timer = null, drawn = false;
  function startMessage(force) {
    if (mode === "play") return;
    if (drawn && !force) return;
    cancelAnimationFrame(raf); clearTimeout(timer);
    mode = "message"; drawn = true;
    lcdLeft.textContent = "NOKIA CASE"; lcdRight.textContent = "2026";
    const steps = pathThrough(TARGETS, [0, ROWS - 1]);
    const lit = new Set(), body = [];
    let i = 0;
    const perFrame = reduce ? steps.length : 3;
    function frame() {
      for (let k = 0; k < perFrame && i < steps.length; k++, i++) {
        const [x, y, t] = steps[i];
        body.push([x, y]); if (body.length > 6) body.shift();
        if (t) lit.add(x + "," + y);
      }
      clear();
      for (let gx = 0; gx < COLS; gx += 2) for (let gy = 0; gy < ROWS; gy += 2) cell(gx, gy, "rgba(67,82,61,0.04)");
      lit.forEach(k => { const [x, y] = k.split(",").map(Number); cell(x, y, INK); });
      body.forEach(([x, y], bi) => cell(x, y, bi === body.length - 1 ? INK : FAINT.replace("0.18", String(.25 + bi * .1))));
      if (i < steps.length && mode === "message") raf = requestAnimationFrame(frame);
      else if (mode === "message") blink(lit, 0);
    }
    frame();
  }
  function blink(lit, n) {
    clear();
    if (n % 2 === 0 || n >= 6) lit.forEach(k => { const [x, y] = k.split(",").map(Number); cell(x, y, INK); });
    if (n < 6) timer = setTimeout(() => blink(lit, n + 1), 220);
    else { mode = "done"; lcdRight.textContent = "▶ O‘YNASH"; }
  }

  /* ---------- game mode ---------- */
  const G = 10, GC = W / G, GR = Math.floor(H / G); // 30 x 19
  let snake, dir, nextDir, food, score, best = 0;
  try { best = +localStorage.getItem("nokia-snake-best") || 0; } catch (e) {}
  function placeFood() {
    do { food = [Math.floor(Math.random() * GC), Math.floor(Math.random() * GR)]; }
    while (snake.some(([x, y]) => x === food[0] && y === food[1]));
  }
  function startGame() {
    cancelAnimationFrame(raf); clearTimeout(timer); clearInterval(timer);
    mode = "play";
    snake = [[8, 9], [7, 9], [6, 9], [5, 9]]; dir = [1, 0]; nextDir = [1, 0]; score = 0;
    placeFood(); updateBar();
    hint.textContent = "Boshqaruv: strelkalar, WASD, telefon tugmalari yoki ekranni surish. Taqdimotga qaytish uchun o‘yinni yakunlang yoki Esc ni bosing.";
    tick(); timer = setInterval(tick, 115);
  }
  function updateBar() { lcdLeft.textContent = "HISOB " + score; lcdRight.textContent = "REKORD " + best; }
  function tick() {
    dir = nextDir;
    const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    head[0] = (head[0] + GC) % GC; head[1] = (head[1] + GR) % GR; // walls wrap, like the classic phone version
    if (snake.some(([x, y]) => x === head[0] && y === head[1])) return gameOver();
    snake.unshift(head);
    if (head[0] === food[0] && head[1] === food[1]) { score++; if (score > best) { best = score; try { localStorage.setItem("nokia-snake-best", best); } catch (e) {} } updateBar(); placeFood(); }
    else snake.pop();
    clear();
    ctx.fillStyle = INK; ctx.fillRect(food[0] * G + 2, food[1] * G + 2, G - 4, G - 4);
    snake.forEach(([x, y], i) => cell(x, y, i === 0 ? INK : "rgba(67,82,61,0.85)", G));
  }
  function gameOver() {
    clearInterval(timer); mode = "done";
    ctx.fillStyle = "rgba(199,240,216,0.82)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = INK; ctx.textAlign = "center";
    ctx.font = "34px VT323, monospace"; ctx.fillText("O‘YIN TUGADI", W / 2, H / 2 - 6);
    ctx.font = "24px VT323, monospace"; ctx.fillText("Hisob: " + score + "   Rekord: " + best, W / 2, H / 2 + 22);
    hint.textContent = "Yana o‘ynash uchun «Snake o‘ynash» tugmasini bosing.";
  }
  function stopGame() { if (mode !== "play") return; clearInterval(timer); mode = "done"; hint.textContent = ""; startMessage(true); }
  function setDir(d) {
    if (mode !== "play") return;
    const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    if (!m) return;
    if (m[0] === -dir[0] && m[1] === -dir[1]) return;
    nextDir = m;
  }

  addEventListener("keydown", e => {
    if (mode !== "play") return;
    const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
    if (map[e.key]) { e.preventDefault(); e.stopImmediatePropagation(); setDir(map[e.key]); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); stopGame(); }
  }, true);
  document.querySelectorAll("[data-dir]").forEach(b => b.addEventListener("click", () => setDir(b.dataset.dir)));
  let sx = null, sy = null;
  cv.addEventListener("touchstart", e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  cv.addEventListener("touchend", e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up"));
  });
  document.getElementById("playBtn").addEventListener("click", e => { e.currentTarget.blur(); startGame(); });
  document.getElementById("replayBtn").addEventListener("click", e => { e.currentTarget.blur(); if (mode === "play") clearInterval(timer); mode = "idle"; startMessage(true); hint.textContent = ""; });

  clear();
  window.SnakeRahmat = { startMessage: () => startMessage(false), isPlaying: () => mode === "play" };
})();
