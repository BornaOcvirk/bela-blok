// Bela scoring (Croatian rules): 162 points per hand (152 + 10 for last trick),
// štiglja (all tricks) +90, the calling team needs MORE than half of all points
// (cards + zvanja) or it falls ("pad") and the other team takes everything.
const HAND = 162, STIGLJA = 90;

function scoreHand({ caller, cards, zvanja, stiglja = null }) {
  const c = stiglja == null ? cards : stiglja === 0 ? [HAND + STIGLJA, 0] : [0, HAND + STIGLJA];
  const t = [c[0] + zvanja[0], c[1] + zvanja[1]];
  const all = t[0] + t[1];
  const fell = t[caller] * 2 <= all;
  if (!fell) return { score: t, fell };
  const score = [0, 0];
  score[1 - caller] = all;
  return { score, fell };
}

function totals(hands) {
  return hands.reduce((a, h) => [a[0] + h.score[0], a[1] + h.score[1]], [0, 0]);
}

// Returns winning team index, or null while the game is still on.
function winner(game) {
  if (game.belot != null) return game.belot;
  const [a, b] = totals(game.hands);
  if (Math.max(a, b) < game.target || a === b) return null;
  return a > b ? 0 : 1;
}

// Checks an imported backup before it replaces the data. Ids go into onclick attributes, so they must be plain.
const isId = v => typeof v === 'string' && /^[a-z0-9]+$/i.test(v);
const isPair = a => Array.isArray(a) && a.length === 2;
const isTeam = v => v === 0 || v === 1;
function validBackup(d) {
  return !!d && Array.isArray(d.players) && Array.isArray(d.games)
    && d.players.every(p => p && isId(p.id) && typeof p.name === 'string')
    && d.games.every(g => g && isId(g.id) && Number.isFinite(g.target) && (g.belot == null || isTeam(g.belot))
      && isPair(g.teams) && g.teams.every(t => Array.isArray(t) && (t.length === 2 || !t.length) && t.every(isId)) && Array.isArray(g.hands)
      && g.hands.every(h => h && isTeam(h.caller) && isPair(h.score) && h.score.every(Number.isFinite)
        && isPair(h.zv) && h.zv.every(z => Array.isArray(z) && z.every(Number.isFinite))
        && isPair(h.bela) && h.bela.every(isTeam) && (h.stiglja == null || isTeam(h.stiglja)))
      && (g.tour == null || !!g.tour && isId(g.tour.id) && /^(\d+-\d+|\d+:\d+|3)$/.test(g.tour.key) && isPair(g.tour.teams) && g.tour.teams.every(Number.isInteger)))
    && (d.tournaments == null || Array.isArray(d.tournaments) && d.tournaments.every(t => t && isId(t.id)
      && typeof t.name === 'string' && Number.isFinite(t.date) && Array.isArray(t.teams) && t.teams.length >= 2
      && t.teams.every(x => typeof x === 'string' || !!x && typeof x.name === 'string' && Array.isArray(x.players) && x.players.every(isId)) && t.wins && typeof t.wins === 'object' && Object.values(t.wins).every(Number.isInteger)));
}

// Tournaments: t = { teams, wins: { key: team index }, mode: 'kup' | 'liga', third, bo3, v }.
// Knockout ("kup") round 1 uses standard seeding: team i meets team size-1-i, so teams 0 and 1 can only meet in the
// final and the top teams get the byes (null). A team added later fills the next free bye without moving anyone.
// v === 1: made before seeding, round 1 was team m vs team half+m.
function seedOrder(size) { let o = [0]; while (o.length < size) { const k = o.length * 2; o = o.flatMap(s => [s, k - 1 - s]); } return o; }
// wins keys are 'round-match'. A stored winner no longer in its match (an earlier result was fixed) is ignored.
function bracket(n, wins, legacy = false) {
  let size = 2; while (size < n) size *= 2;
  const half = size / 2, o = seedOrder(size), slot = i => i < n ? i : null;
  let pairs = Array.from({ length: half }, (_, m) => legacy ? [m, slot(half + m)] : [o[2 * m], slot(o[2 * m + 1])]);
  const rounds = [];
  for (let r = 0; pairs.length; r++) {
    const ms = pairs.map(([a, b], m) => {
      const s = wins[r + '-' + m];
      return { a, b, w: r === 0 && b == null ? a : a != null && b != null && (s === a || s === b) ? s : null };
    });
    rounds.push(ms);
    pairs = ms.length > 1 ? ms.filter((_, m) => m % 2 === 0).map((x, m) => [x.w, ms[2 * m + 1].w]) : [];
  }
  return rounds;
}
const rounds = t => bracket(t.teams.length, t.wins, t.v === 1);
// Match for 3rd place between the semi-final losers (key '3'); only with 4+ teams.
function thirdPlace(t) {
  if (t.mode === 'liga' || !t.third || t.teams.length < 4) return null;
  const lose = x => x.w == null || x.a == null || x.b == null ? null : x.w === x.a ? x.b : x.a;
  const [p, q] = rounds(t).at(-2), a = lose(p), b = lose(q), s = t.wins['3'];
  return { key: '3', a, b, w: a != null && b != null && (s === a || s === b) ? s : null };
}
// League play order (circle method): everyone meets everyone once, spread out over rounds. Keys are 'a:b' with a < b.
function roundRobin(n) {
  const ids = [...Array(n).keys()], out = [];
  if (n % 2) ids.push(null);
  for (let r = 0; r < ids.length - 1; r++) {
    for (let i = 0; i < ids.length / 2; i++) {
      const a = ids[i], b = ids[ids.length - 1 - i];
      if (a != null && b != null) out.push(a < b ? [a, b] : [b, a]);
    }
    ids.splice(1, 0, ids.pop());
  }
  return out;
}
// Every match in play order, each { key, a, b, w }. Knockout: rounds in order, 3rd place just before the final.
function matchList(t) {
  if (t.mode === 'liga') return roundRobin(t.teams.length).map(([a, b]) => {
    const key = a + ':' + b, s = t.wins[key];
    return { key, a, b, w: s === a || s === b ? s : null };
  });
  const rs = rounds(t), th = thirdPlace(t), out = [];
  rs.forEach((ms, r) => { if (r === rs.length - 1 && th) out.push(th); ms.forEach((x, m) => out.push({ key: r + '-' + m, ...x })); });
  return out;
}
// League table: most wins, then points difference (diff = { team: points for minus against } from played games).
function standings(t, diff = {}) {
  const rows = t.teams.map((_, i) => ({ i, p: 0, w: 0, d: diff[i] ?? 0 }));
  for (const x of matchList(t)) if (x.w != null) { rows[x.a].p++; rows[x.b].p++; rows[x.w].w++; }
  return rows.sort((a, b) => b.w - a.w || b.d - a.d || a.i - b.i);
}
function champion(t, diff) {
  const ms = matchList(t);
  if (t.mode !== 'liga') return ms.at(-1).w;
  return ms.every(x => x.w != null) ? standings(t, diff)[0].i : null;
}
// Only the results that still count (drops ones made stale by a fixed result or a changed team list).
function liveWins(t) {
  const out = {};
  for (const x of matchList(t)) if (x.w != null && x.a != null && x.b != null) out[x.key] = x.w;
  return out;
}

if (typeof module !== 'undefined') module.exports = { scoreHand, totals, winner, validBackup, bracket, seedOrder, thirdPlace, roundRobin, matchList, standings, champion, liveWins, HAND };
