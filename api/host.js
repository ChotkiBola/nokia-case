import { pipe, readBody, fail, STATES, CLOUDS, POLLS } from "./_redis.js";

// POST /api/host — presenter-only actions
//   { a: "state", s: "cloud:w1", key }   tell every phone which interaction to show
//   { a: "hide",  k: "w1", w: "word", key }  remove a word from the cloud
//   { a: "reset", key }                  clear all votes, words and reactions
// If HOST_KEY (or RESET_KEY) is set in Vercel, the key must match.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Faqat POST so‘rovi qabul qilinadi" });
  }
  const b = await readBody(req);
  const secret = process.env.HOST_KEY || process.env.RESET_KEY;
  if (secret && b.key !== secret) return res.status(403).json({ error: "Boshqaruvchi kaliti noto‘g‘ri" });
  try {
    if (b.a === "state") {
      if (!STATES.includes(b.s)) return res.status(400).json({ error: "Noto‘g‘ri holat" });
      await pipe([["SET", "nokia:state", b.s]]);
      return res.status(200).json({ ok: true });
    }
    if (b.a === "hide") {
      if (!CLOUDS.includes(b.k)) return res.status(400).json({ error: "Noto‘g‘ri savol" });
      await pipe([["HDEL", `nokia:words:${b.k}`, String(b.w || "")]]);
      return res.status(200).json({ ok: true });
    }
    if (b.a === "reset") {
      await pipe([["DEL", "nokia:state", "nokia:online", "nokia:react", "nokia:react:total",
        ...CLOUDS.map(c => `nokia:words:${c}`), ...Object.keys(POLLS).map(p => `nokia:poll:${p}`)]]);
      return res.status(200).json({ ok: true, message: "Barcha ovozlar, so‘zlar va reaksiyalar o‘chirildi" });
    }
    return res.status(400).json({ error: "Noma’lum amal" });
  } catch (e) {
    return fail(res, e);
  }
}
