// Minimal Upstash Redis REST client (no dependencies).
// Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Both are supported.

export const POLLS = {
  q0: ["iphone", "samsung", "other"],
  q1: ["android", "wp", "own"],
  q2: ["tech", "mgmt", "comp"],
};
export const CLOUDS = ["w1", "w2"];
// team quiz «Nokia muzeyi»: index of the correct option for each question (texts live in site.js / join.html)
export const QUIZ = [1, 2, 2, 0, 1, 2, 2, 2];
export const QUIZ_TIME = 20000; // ms per question
export const TEAMS = ["a", "b", "c"];
export const REACTIONS = 6; // indexes 0..5, mapped to emoji on the client
export const STATES = ["welcome", "react", "cloud:w1", "cloud:w2", "poll:q0", "poll:q1", "poll:q2", "team", ...QUIZ.flatMap((_, i) => [`quiz:${i}`, `qrev:${i}`]), "qend", "end"];

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const err = new Error("Redis ulanmagan: Vercel’da Upstash integratsiyasini qo‘shing");
    err.status = 503;
    throw err;
  }
  return { url, token };
}

// Runs several commands in one round trip. Returns an array of results.
export async function pipe(commands) {
  const { url, token } = creds();
  const r = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(j)) {
    const err = new Error((j && j.error) || `Redis xatosi ${r.status}`);
    err.status = 502;
    throw err;
  }
  return j.map(x => {
    if (x && x.error) { const err = new Error(x.error); err.status = 502; throw err; }
    return x ? x.result : null;
  });
}

export function hashToObject(flat) {
  const o = {};
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) o[flat[i]] = Number(flat[i + 1]) || 0;
  return o;
}

export async function readBody(req) {
  let body = req.body;
  if (body === undefined) {
    let raw = "";
    for await (const c of req) raw += c;
    body = raw;
  }
  if (typeof body === "string") { try { body = JSON.parse(body || "{}"); } catch { body = {}; } }
  return body || {};
}

export function fail(res, e) {
  return res.status(e.status || 500).json({ error: e.message || "Server xatosi" });
}

// Scores for the quiz: every player's total, team averages, option counts for question `cur`.
export async function quizStats(cur) {
  const out = await pipe([["HGETALL", "nokia:team"], ...QUIZ.map((_, i) => ["HGETALL", `nokia:ans:${i}`])]);
  const parse = x => { try { return JSON.parse(x); } catch { return null; } };
  const players = {};
  const tf = out[0] || [];
  for (let i = 0; i < tf.length; i += 2) {
    const v = parse(tf[i + 1]);
    if (v && TEAMS.includes(v.t)) players[tf[i]] = { n: v.n || "", t: v.t, p: 0, last: null };
  }
  const counts = [0, 0, 0, 0];
  let answered = 0;
  out.slice(1).forEach((flat, qi) => {
    flat = flat || [];
    for (let i = 0; i < flat.length; i += 2) {
      const v = parse(flat[i + 1]);
      if (!v) continue;
      const pl = players[flat[i]] || (players[flat[i]] = { n: "", t: v.t, p: 0, last: null });
      pl.p += Number(v.p) || 0;
      if (qi === cur) { answered++; if (counts[v.o] !== undefined) counts[v.o]++; pl.last = v; }
    }
  });
  const teams = {};
  TEAMS.forEach(t => {
    const m = Object.values(players).filter(p => p.t === t);
    const sum = m.reduce((a, p) => a + p.p, 0);
    teams[t] = { members: m.length, sum, score: m.length ? Math.round(sum / m.length) : 0 };
  });
  const top = Object.values(players).sort((a, b) => b.p - a.p).slice(0, 5).map(({ n, t, p }) => ({ n, t, p }));
  return { counts, answered, teams, top, players };
}
