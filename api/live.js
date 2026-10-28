import { pipe, hashToObject, fail, POLLS, CLOUDS } from "./_redis.js";

// GET /api/live
//   phone:  ?id=<device id>                      -> current state + heartbeat
//   screen: ?screen=1[&cloud=w1][&poll=q1][&totals=1] -> state, online count, recent reactions, cloud/poll counts
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const now = Date.now();
  const cmds = [["GET", "nokia:state"]];
  const idx = {};
  const id = typeof q.id === "string" ? q.id.slice(0, 40).replace(/[^\w-]/g, "") : "";
  if (id) { idx.beat = cmds.length; cmds.push(["ZADD", "nokia:online", now, id]); }
  if (q.screen) {
    cmds.push(["ZREMRANGEBYSCORE", "nokia:online", "-inf", now - 15000]);
    idx.online = cmds.length; cmds.push(["ZCARD", "nokia:online"]);
    idx.react = cmds.length; cmds.push(["LRANGE", "nokia:react", 0, 79]);
    if (CLOUDS.includes(q.cloud)) { idx.cloud = cmds.length; cmds.push(["HGETALL", `nokia:words:${q.cloud}`]); }
    if (POLLS[q.poll]) { idx.poll = cmds.length; cmds.push(["HGETALL", `nokia:poll:${q.poll}`]); }
    if (q.totals) { idx.totals = cmds.length; cmds.push(["HGETALL", "nokia:react:total"]); }
  }
  try {
    const out = await pipe(cmds);
    const body = { state: out[0] || "welcome" };
    if (q.screen) {
      body.online = Number(out[idx.online]) || 0;
      body.reactions = (out[idx.react] || []).map(s => {
        const [rid, i] = String(s).split(":");
        return { id: rid, i: Number(i) };
      });
      if (idx.cloud !== undefined) body.cloud = hashToObject(out[idx.cloud]);
      if (idx.poll !== undefined) body.poll = hashToObject(out[idx.poll]);
      if (idx.totals !== undefined) body.totals = hashToObject(out[idx.totals]);
    }
    return res.status(200).json(body);
  } catch (e) {
    return fail(res, e);
  }
}
