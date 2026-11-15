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
      && isPair(g.teams) && g.teams.every(t => isPair(t) && t.every(isId)) && Array.isArray(g.hands)
      && g.hands.every(h => h && isTeam(h.caller) && isPair(h.score) && h.score.every(Number.isFinite)
        && isPair(h.zv) && h.zv.every(z => Array.isArray(z) && z.every(Number.isFinite))
        && isPair(h.bela) && h.bela.every(isTeam) && (h.stiglja == null || isTeam(h.stiglja)))
      && (g.tour == null || !!g.tour && isId(g.tour.id) && /^\d+-\d+$/.test(g.tour.key) && isPair(g.tour.teams) && g.tour.teams.every(Number.isInteger)))
    && (d.tournaments == null || Array.isArray(d.tournaments) && d.tournaments.every(t => t && isId(t.id)
      && typeof t.name === 'string' && Number.isFinite(t.date) && Array.isArray(t.teams) && t.teams.length >= 2
      && t.teams.every(x => typeof x === 'string' || !!x && typeof x.name === 'string' && Array.isArray(x.players) && x.players.every(isId)) && t.wins && typeof t.wins === 'object' && Object.values(t.wins).every(Number.isInteger)));
}

// Single-elimination bracket. Round 1 match m is team m vs team half+m; missing teams up to the next power of 2 are byes (null).
// That way a team added later fills the next free bye without moving anyone else.
// wins = { 'round-match': team index }. A stored winner no longer in its match (an earlier result was fixed) is ignored.
function bracket(n, wins) {
  let size = 2; while (size < n) size *= 2;
  const half = size / 2;
  let pairs = Array.from({ length: half }, (_, m) => [m, half + m < n ? half + m : null]);
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
// Only the results that still count (drops ones made stale by a fixed result or a changed team list).
function liveWins(n, wins) {
  const out = {};
  bracket(n, wins).forEach((ms, r) => ms.forEach((x, m) => { if (x.w != null && x.b != null) out[r + '-' + m] = x.w; }));
  return out;
}

if (typeof module !== 'undefined') module.exports = { scoreHand, totals, winner, validBackup, bracket, liveWins, HAND };
