// Minimal Upstash Redis REST client (no dependencies).
// Vercel's Upstash integration sets KV_REST_API_URL / KV_REST_API_TOKEN
// or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — both are supported.
export const POLLS = {
  q1: ["android", "wp", "own"],
  q2: ["tech", "mgmt", "comp"],
};

export async function redis(...command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const err = new Error("Redis ulanmagan: Vercel’da Upstash integratsiyasini qo‘shing");
    err.status = 503;
    throw err;
  }
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (!r.ok || j.error) {
    const err = new Error(j.error || `Redis xatosi ${r.status}`);
    err.status = 502;
    throw err;
  }
  return j.result;
}
