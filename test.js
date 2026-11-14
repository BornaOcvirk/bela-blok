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
console.log('ok');
