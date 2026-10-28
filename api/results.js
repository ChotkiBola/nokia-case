import { redis, POLLS } from "./_redis.js";

export default async function handler(req, res) {
  const poll = req.query.poll;
  if (!POLLS[poll]) return res.status(400).json({ error: "Noto‘g‘ri savol" });
  res.setHeader("Cache-Control", "no-store");
  try {
    const flat = (await redis("HGETALL", `nokia:poll:${poll}`)) || [];
    const counts = {};
    for (let i = 0; i < flat.length; i += 2) counts[flat[i]] = Number(flat[i + 1]) || 0;
    return res.status(200).json({ poll, counts });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message });
  }
}
