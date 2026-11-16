const assert = require('assert'); const GM = require('../app/gemini-klijent.js'); const { KeyRing } = GM;
const err = (status, extra) => Object.assign(new Error('x' + status), { status }, extra);
(async () => {
  let r = new KeyRing('a,b,c\nd;e'); assert.equal(r.keys.length, 5);
  const used = []; for (let i = 0; i < 10; i++) await r.run(async k => { used.push(k); });
  for (const k of 'abcde') assert.equal(used.filter(x => x === k).length, 2);
  r = new KeyRing('a,b,c'); r.next = 0; let calls = [];
  assert.equal(await r.run(async k => { calls.push(k); if (k === 'a') throw err(429); return k; }), 'b');
  calls = []; await r.run(async k => { calls.push(k); }); await r.run(async k => { calls.push(k); }); assert(!calls.includes('a'));
  r = new KeyRing('a,b'); r.next = 0; await r.run(async k => { if (k === 'a') throw err(400, { keyInvalid: true }); return k; }); assert(r.dead[0]);
  r = new KeyRing('a,b'); calls = []; await assert.rejects(r.run(async k => { calls.push(k); throw err(400); })); assert.equal(calls.length, 1);
  r = new KeyRing('a,b,c'); calls = []; await assert.rejects(r.run(async k => { calls.push(k); throw err(503); }), /503/); assert.equal(calls.length, 3);
  let t = 0; r = new KeyRing('a'); r.now = () => t; r.next = 0; await assert.rejects(r.run(async () => { throw err(429); })); t = 61000; assert.equal(await r.run(async k => k), 'a');
  assert.throws(() => new KeyRing(' , '));
  // sastavi: provjera i čišćenje odgovora modela
  const m = { scope: 'ZAJEDNICKI', tacke: [{ naslov: 'A', nacin: 'Bez glasanja' }, { naslov: 'B' }], zadaci: [] };
  const out = GM.sastavi(m, { tacke: [{ rasprava: 'R', za: 5, nacin: 'Nešto', zakljucak: 'Z' }], zadaci: [{ zadatak: 'T', odgovorna: 'S', rok: '2026-02-30' }, { zadatak: '  ' }, { zadatak: 'U', rok: '2026-11-27' }], naredni: 7 }, 'tr');
  assert.equal(out.tacke.length, 2); assert.equal(out.tacke[0].za, ''); assert.equal(out.tacke[0].nacin, 'Bez glasanja');
  assert.equal(out.tacke[1].rasprava, ''); assert.equal(out.zadaci.length, 2); assert.equal(out.zadaci[0].rok, ''); assert.equal(out.zadaci[1].rok, '2026-11-27');
  assert.equal(out.zadaci[0].oznaka, 'zajedničko'); assert.equal(out.naredni, '');
  // nacrt: neispravan JSON i prekid zbog dužine
  const mk = (text, fr) => async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: fr }] }) });
  await assert.rejects(GM.nacrt(new KeyRing('a'), 'x', ['A'], { fetch: mk('nije json', 'STOP') }), /ispravan/);
  await assert.rejects(GM.nacrt(new KeyRing('a'), 'x', ['A'], { fetch: mk('{"tacke":[]}', 'MAX_TOKENS') }), /predug/);
  assert.deepEqual((await GM.nacrt(new KeyRing('a'), 'x', ['A'], { fetch: mk('```json\n{"tacke":[]}\n```', 'STOP') })).tacke, []);
  console.log('gemini-klijent: OK');
})().catch(e => { console.error(e); process.exit(1); });
