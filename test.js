// Run: node test.js
const assert = require('assert');
const { scoreHand, winner } = require('./docs/bela.js');
const s = (caller, cards, zvanja = [0, 0], stiglja = null) => scoreHand({ caller, cards, zvanja, stiglja });

assert.deepStrictEqual(s(0, [100, 62]), { score: [100, 62], fell: false });
assert.deepStrictEqual(s(0, [81, 81]), { score: [0, 162], fell: true });          // exactly half = pad
assert.deepStrictEqual(s(0, [91, 71], [0, 20]), { score: [0, 182], fell: true }); // 91 of 182 = pad
assert.deepStrictEqual(s(0, [92, 70], [0, 20]), { score: [92, 90], fell: false }); // 92 passes
assert.deepStrictEqual(s(1, [0, 0], [0, 20], 1), { score: [0, 272], fell: false }); // štiglja + bela
assert.deepStrictEqual(s(0, [0, 0], [0, 0], 1), { score: [0, 252], fell: true });  // caller got nothing

const g = (hands, belot = null) => ({ target: 1001, belot, hands: hands.map(score => ({ score })) });
assert.strictEqual(winner(g([[900, 100]])), null);
assert.strictEqual(winner(g([[900, 100], [120, 42]])), 0);
assert.strictEqual(winner(g([[900, 950], [150, 100]])), null); // both over, tied -> keep playing
assert.strictEqual(winner(g([[10, 0]], 1)), 1);                // belot wins instantly
const { firstDealer } = require('./docs/bela.js');
[[0, 0, 0], [1, 0, 2], [3, 0, 0], [1, 1, 1], [2, 1, 3], [0, 1, 1]].forEach(([n, w, d]) => assert.strictEqual(firstDealer(n, w), d));
const { validBackup } = require('./docs/bela.js');
const hand = { caller: 0, score: [100, 62], zv: [[20], []], bela: [0, 1], stiglja: null };
const backup = { players: [{ id: 'a1', name: 'Ana' }], games: [{ id: 'g1', target: 1001, belot: null, teams: [['a1', 'b'], ['c', 'd']], hands: [hand] }] };
assert.ok(validBackup(backup));
assert.ok(validBackup({ players: [], games: [] }));
assert.ok(validBackup({ ...backup, games: [{ ...backup.games[0], teams: [[], []] }] })); // game without players
assert.ok(!validBackup({ ...backup, games: [{ ...backup.games[0], teams: [['a1'], []] }] }));
assert.ok(!validBackup(null));
assert.ok(!validBackup({ players: [{ id: "x');alert(1);//", name: 'X' }], games: [] })); // injection via id
assert.ok(!validBackup({ ...backup, games: [{ ...backup.games[0], hands: [{ ...hand, score: ['1', 2] }] }] }));
assert.ok(validBackup({ ...backup, tournaments: [{ id: 't1', name: 'T', date: 1, teams: ['A', 'B'], wins: { '0-0': 1 } }] }));
assert.ok(validBackup({ ...backup, tournaments: [{ id: 't1', name: 'T', date: 1, teams: [{ name: 'A', players: ['a1', 'b'] }, 'B'], wins: {} }],
  games: [{ ...backup.games[0], tour: { id: 't1', key: '0-0', teams: [0, 1] } }] }));
assert.ok(!validBackup({ ...backup, games: [{ ...backup.games[0], tour: { id: 't1', key: "0');x(//", teams: [0, 1] } }] }));
assert.ok(!validBackup({ ...backup, tournaments: [{ id: 't1', name: 'T', date: 1, teams: [{ name: 'A', players: ["x');y(//"] }, 'B'], wins: {} }] }));
assert.ok(!validBackup({ ...backup, tournaments: [{ id: "t');x(//", name: 'T', date: 1, teams: ['A', 'B'], wins: {} }] }));

const { bracket, seedOrder, roundRobin, matchList, standings, champion, liveWins } = require('./docs/bela.js');
const T = (n, wins = {}, o = {}) => ({ teams: Array.from({ length: n }, (_, i) => 'T' + i), wins, ...o });
assert.deepStrictEqual(seedOrder(8), [0, 7, 3, 4, 1, 6, 2, 5]);                 // 1v8, 4v5, 2v7, 3v6
assert.deepStrictEqual(bracket(5, {})[0].map(x => [x.a, x.b]), [[0, null], [3, 4], [1, null], [2, null]]); // top 3 get byes
{ const [a, b] = [5, 6].map(n => bracket(n, {})[0]); assert.deepStrictEqual([a[0], a[1], a[2]], [b[0], b[1], b[2]]); } // 6th team only fills a bye
assert.deepStrictEqual(bracket(3, {}, true)[0], [{ a: 0, b: 2, w: null }, { a: 1, b: null, w: 1 }]); // old layout kept for v1
assert.strictEqual(champion(T(2, { '0-0': 1 })), 1);
assert.strictEqual(champion(T(3, { '0-1': 2, '1-0': 2 })), 2);
assert.strictEqual(champion(T(3, { '0-1': 1, '1-0': 2 })), null);              // fixed round 1: stale final result ignored
assert.deepStrictEqual(liveWins(T(3, { '0-1': 1, '1-0': 2, '5-5': 1 })), { '0-1': 1 });
// 3rd place: semi losers meet before the final
{ const t = T(4, { '0-0': 0, '0-1': 2 }, { third: true }), ks = matchList(t).map(x => x.key);
  assert.deepStrictEqual(ks, ['0-0', '0-1', '3', '1-0']);
  assert.deepStrictEqual(matchList(t)[2], { key: '3', a: 3, b: 1, w: null }); }
// league: every pair exactly once, table by wins then points difference
{ const pairs = roundRobin(5).map(p => p.join(':')).sort();
  assert.strictEqual(pairs.length, 10); assert.strictEqual(new Set(pairs).size, 10); }
{ const t = T(3, { '0:1': 0, '0:2': 2, '1:2': 1 }, { mode: 'liga' });               // everyone 1 win
  assert.strictEqual(champion(t, { 2: 50 }), 2);
  assert.deepStrictEqual(standings(t).map(r => r.w), [1, 1, 1]);
  assert.strictEqual(champion({ ...t, wins: { '0:1': 0 } }), null); }               // not all played yet
const { sortPlayers } = require('./docs/bela.js');
{ const r = (name, g, w, pts = 0) => ({ p: { name }, s: { g, w, pts } }), rows = [r('Ivo', 4, 1), r('Ana', 2, 2), r('Šime', 0, 0), r('Bero', 4, 3)];
  const names = o => sortPlayers(rows, o).map(x => x.p.name).join();
  assert.strictEqual(names({}), 'Bero,Ana,Ivo,Šime');                          // most wins first
  assert.strictEqual(names({ sort: 'pct' }), 'Ana,Bero,Ivo,Šime');
  assert.strictEqual(names({ sort: 'g' }), 'Bero,Ivo,Ana,Šime');              // tie on games -> by name
  assert.strictEqual(names({ sort: 'name', desc: false }), 'Ana,Bero,Ivo,Šime');
  assert.strictEqual(names({ filter: 'l', min: 1 }), 'Bero,Ivo');              // at least 1 loss
  assert.strictEqual(names({ filter: 'pct', min: 75 }), 'Bero,Ana'); }

{ // games from other phones: me, a linked player, a same-name player and a stranger; then edit, delete, drop
  const { mergeCloud } = require('./docs/bela.js');
  let n = 0; const newId = () => 'n' + n++;
  const me = { uid: 'ME', name: 'borna' };
  const db = { players: [{ id: 'p1', name: 'Borna' }, { id: 'p2', name: 'Ana', uid: 'ANA' }, { id: 'p3', name: 'Ivo' }], games: [] };
  const g = { id: 'g1', date: 1, target: 1001, belot: null, hands: [{ caller: 0, score: [600, 400], zv: [[], []], bela: [0, 0], stiglja: null }],
    teams: [['ME', 'ANA'], ['x', 'x']], names: [['B', 'A'], ['ivo', 'Marko']] };
  const doc = { by: 'SC', g };
  assert.ok(mergeCloud(db, [doc, { by: 'ME', g: { ...g, id: 'own' } }], me, newId));
  assert.deepStrictEqual(db.games.map(x => [x.id, x.from, x.teams]), [['SCg1', 'SC', [['p1', 'p2'], ['p3', 'n0']]]]); // own game ignored
  assert.deepStrictEqual(db.players[0], { id: 'p1', name: 'Borna', uid: 'ME', acct: 'borna' });                      // my player gets linked
  assert.deepStrictEqual(db.players[3], { id: 'n0', name: 'Marko', guest: true });
  assert.ok(!mergeCloud(db, [doc], me, newId));                                                                  // nothing new
  assert.ok(mergeCloud(db, [{ by: 'SC', g: { ...g, hands: [{ ...g.hands[0], score: [700, 400] }] } }], me, newId));            // scorer edited it
  assert.strictEqual(db.games[0].hands[0].score[0], 700);
  assert.strictEqual(db.players.length, 4);                                                                      // same people reused
  assert.ok(mergeCloud(db, [], me, newId) && db.games.length === 0);                                             // scorer deleted it
  assert.ok(!mergeCloud(db, [doc], { ...me, drop: ['SCg1'] }, newId) && db.games.length === 0);                  // deleted here: stays out
  const fresh = { players: [], games: [] };
  mergeCloud(fresh, [doc], me, newId);                                                                           // no player of mine yet
  assert.deepStrictEqual(fresh.players[0], { id: 'n1', name: 'borna', uid: 'ME', acct: 'borna' });
  assert.ok(require('./docs/bela.js').validBackup(fresh));
}
console.log('ok');
