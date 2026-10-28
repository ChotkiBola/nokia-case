import { redis, POLLS } from "./_redis.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Faqat POST so‘rovi qabul qilinadi" });
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { poll, option } = body || {};
  if (!POLLS[poll] || !POLLS[poll].includes(option)) {
    return res.status(400).json({ error: "Noto‘g‘ri savol yoki javob" });
  }
  try {
    await redis("HINCRBY", `nokia:poll:${poll}`, option, 1);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
