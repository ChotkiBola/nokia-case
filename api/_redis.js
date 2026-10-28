// Minimal Upstash Redis REST client (no dependencies).
// Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN). Both are supported.

export const POLLS = {
  q1: ["android", "wp", "own"],
  q2: ["tech", "mgmt", "comp"],
};
export const CLOUDS = ["w1", "w2"];
export const REACTIONS = 6; // indexes 0..5, mapped to emoji on the client
export const STATES = ["welcome", "react", "cloud:w1", "cloud:w2", "poll:q1", "poll:q2", "end"];

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
