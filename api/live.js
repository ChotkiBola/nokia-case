import { pipe, hashToObject, fail, POLLS, CLOUDS, QUIZ, quizStats } from "./_redis.js";

// GET /api/live
//   phone:  ?id=<device id>                      -> current state + heartbeat
//   phone after reveal: ?id=..&me=1            -> + own quiz score
//   screen: ?screen=1[&cloud=w1][&poll=q1][&totals=1][&quiz=N] -> state, online count, recent reactions, cloud/poll counts
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const q = req.query || {};
  const now = Date.now();
  const cmds = [["GET", "nokia:state"], ["GET", "nokia:run"]];
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
    const body = { state: out[0] || "welcome", run: out[1] || "" };
    if (q.screen) {
      body.online = Number(out[idx.online]) || 0;
      body.reactions = (out[idx.react] || []).map(s => {
        const [rid, i] = String(s).split(":");
        return { id: rid, i: Number(i) };
      });
      if (idx.cloud !== undefined) body.cloud = hashToObject(out[idx.cloud]);
      if (idx.poll !== undefined) body.poll = hashToObject(out[idx.poll]);
      if (idx.totals !== undefined) body.totals = hashToObject(out[idx.totals]);
      if (q.quiz !== undefined) {
        const cur = Math.max(0, Math.min(QUIZ.length - 1, Number(q.quiz) || 0));
        const { counts, answered, teams, top } = await quizStats(cur);
        body.quiz = { counts, answered, teams, top };
      }
    }
    // phone after a quiz reveal: own result (asked once per reveal, not on every poll)
    if (id && q.me && /^(qrev:\d+|qend)$/.test(body.state)) {
      const cur = body.state === "qend" ? -1 : Number(body.state.split(":")[1]);
      const { teams, players } = await quizStats(cur);
      const me = players[id] || { p: 0, t: "", last: null };
      const all = Object.values(players);
      const order = Object.entries(teams).sort((a, b) => b[1].score - a[1].score).map(([t]) => t);
      body.me = { p: me.p, t: me.t, last: me.last, rank: 1 + all.filter(x => x.p > me.p).length, of: all.length, teamRank: me.t ? order.indexOf(me.t) + 1 : 0 };
      if (cur >= 0) body.correct = QUIZ[cur];
    }
    return res.status(200).json(body);
  } catch (e) {
    return fail(res, e);
  }
}
