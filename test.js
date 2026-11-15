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
const { validBackup } = require('./docs/bela.js');
const hand = { caller: 0, score: [100, 62], zv: [[20], []], bela: [0, 1], stiglja: null };
const backup = { players: [{ id: 'a1', name: 'Ana' }], games: [{ id: 'g1', target: 1001, belot: null, teams: [['a1', 'b'], ['c', 'd']], hands: [hand] }] };
assert.ok(validBackup(backup));
assert.ok(validBackup({ players: [], games: [] }));
assert.ok(!validBackup(null));
assert.ok(!validBackup({ players: [{ id: "x');alert(1);//", name: 'X' }], games: [] })); // injection via id
assert.ok(!validBackup({ ...backup, games: [{ ...backup.games[0], hands: [{ ...hand, score: ['1', 2] }] }] }));
assert.ok(validBackup({ ...backup, tournaments: [{ id: 't1', name: 'T', date: 1, teams: ['A', 'B'], wins: { '0-0': 1 } }] }));
assert.ok(!validBackup({ ...backup, tournaments: [{ id: "t');x(//", name: 'T', date: 1, teams: ['A', 'B'], wins: {} }] }));

const { bracket, liveWins } = require('./docs/bela.js');
const champ = (n, w) => bracket(n, w).at(-1)[0].w;
assert.deepStrictEqual(bracket(3, {}).map(r => r.length), [2, 1]);
assert.deepStrictEqual(bracket(3, {})[0], [{ a: 0, b: 2, w: null }, { a: 1, b: null, w: 1 }]); // team 1 gets a bye
{ const [a, b] = [5, 6].map(n => bracket(n, {})[0]); assert.deepStrictEqual([a[0], a[2], a[3]], [b[0], b[2], b[3]]); assert.deepStrictEqual(b[1], { a: 1, b: 5, w: null }); } // a 6th team only fills a bye
assert.deepStrictEqual(bracket(5, {}).map(r => r.length), [4, 2, 1]);
assert.strictEqual(champ(2, { '0-0': 1 }), 1);
assert.strictEqual(champ(3, { '0-0': 2, '1-0': 2 }), 2);
assert.strictEqual(champ(3, { '0-0': 0, '1-0': 2 }), null); // fixed round 1: stale final result ignored
assert.deepStrictEqual(liveWins(3, { '0-0': 0, '1-0': 2, '5-5': 1 }), { '0-0': 0 });
assert.strictEqual(champ(3, { '1-0': 0 }), null);           // final not playable yet
console.log('ok');
