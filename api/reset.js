import { redis, POLLS } from "./_redis.js";

// Clears all votes before a new presentation.
// Usage: open /api/reset?key=YOUR_RESET_KEY (RESET_KEY is set in Vercel environment variables).
export default async function handler(req, res) {
  const key = process.env.RESET_KEY;
  if (!key) return res.status(403).json({ error: "RESET_KEY o‘rnatilmagan" });
  if (req.query.key !== key) return res.status(403).json({ error: "Kalit noto‘g‘ri" });
  try {
    await redis("DEL", ...Object.keys(POLLS).map(p => `nokia:poll:${p}`));
    return res.status(200).json({ ok: true, message: "Barcha ovozlar o‘chirildi" });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
