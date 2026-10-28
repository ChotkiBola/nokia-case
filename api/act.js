import { pipe, readBody, fail, POLLS, CLOUDS, REACTIONS } from "./_redis.js";

// POST /api/act  — audience actions from phones
//   { t: "r", i: 0..5, n: 1..10 }        reaction (n = taps batched on the phone)
//   { t: "w", k: "w1", w: "so'z" }       word for the word cloud
//   { t: "v", k: "q1", o: "android" }    poll vote
const WORD_RE = /^[\p{L}\p{N}' -]{1,24}$/u;

export function normalizeWord(raw) {
  return String(raw || "")
    .replace(/[ʻʼ‘’`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("uz");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Faqat POST so‘rovi qabul qilinadi" });
  }
  const b = await readBody(req);
  try {
    if (b.t === "r") {
      const i = Number(b.i);
      if (!Number.isInteger(i) || i < 0 || i >= REACTIONS) return res.status(400).json({ error: "Noto‘g‘ri reaksiya" });
      const n = Math.max(1, Math.min(10, Number(b.n) || 1));
      const items = [];
      for (let k = 0; k < n; k++) items.push(`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}:${i}`);
      await pipe([
        ["LPUSH", "nokia:react", ...items],
        ["LTRIM", "nokia:react", 0, 199],
        ["HINCRBY", "nokia:react:total", String(i), n],
      ]);
      return res.status(200).json({ ok: true });
    }
    if (b.t === "w") {
      if (!CLOUDS.includes(b.k)) return res.status(400).json({ error: "Noto‘g‘ri savol" });
      const w = normalizeWord(b.w);
      if (!WORD_RE.test(w)) return res.status(400).json({ error: "So‘z 1–24 ta harfdan iborat bo‘lsin" });
      await pipe([["HINCRBY", `nokia:words:${b.k}`, w, 1]]);
      return res.status(200).json({ ok: true });
    }
    if (b.t === "v") {
      if (!POLLS[b.k] || !POLLS[b.k].includes(b.o)) return res.status(400).json({ error: "Noto‘g‘ri savol yoki javob" });
      await pipe([["HINCRBY", `nokia:poll:${b.k}`, b.o, 1]]);
      return res.status(200).json({ ok: true });
    }
    return res.status(400).json({ error: "Noma’lum amal" });
  } catch (e) {
    return fail(res, e);
  }
}
