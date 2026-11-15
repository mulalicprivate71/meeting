const assert = require('assert');
const { KeyRing } = require('../keyring');
const err = (status, extra) => Object.assign(new Error('x' + status), { status }, extra);
(async () => {
  // 1) raspodjela: 5 ključeva se koristi redom
  let r = new KeyRing('a,b,c\nd;e'); assert.equal(r.keys.length, 5);
  const used = []; for (let i = 0; i < 10; i++) await r.run(async (k) => { used.push(k); });
  for (const k of 'abcde') assert.equal(used.filter((x) => x === k).length, 2);
  // 2) 429: prelazi na idući, ključ odmara
  r = new KeyRing('a,b,c'); r.next = 0; let calls = [];
  let v = await r.run(async (k) => { calls.push(k); if (k === 'a') throw err(429); return k; });
  assert.deepEqual(calls, ['a', 'b']); assert.equal(v, 'b');
  calls = []; await r.run(async (k) => { calls.push(k); return k; }); await r.run(async (k) => { calls.push(k); return k; });
  assert(!calls.includes('a'), 'ključ koji se odmara se ne koristi');
  // 3) neispravan ključ se trajno isključuje
  r = new KeyRing('a,b'); r.next = 0;
  await r.run(async (k) => { if (k === 'a') throw err(400, { keyInvalid: true }); return k; }); assert(r.dead[0]);
  // 4) greška zahtjeva (400) se ne ponavlja drugim ključem
  r = new KeyRing('a,b'); calls = [];
  await assert.rejects(r.run(async (k) => { calls.push(k); throw err(400); })); assert.equal(calls.length, 1);
  // 5) svi ključevi padnu -> posljednja greška
  r = new KeyRing('a,b,c'); calls = [];
  await assert.rejects(r.run(async (k) => { calls.push(k); throw err(503); }), /503/); assert.equal(calls.length, 3);
  // 6) odmor ističe
  let t = 0; r = new KeyRing('a'); r.now = () => t; r.next = 0;
  await assert.rejects(r.run(async () => { throw err(429); })); t = 61_000;
  assert.equal(await r.run(async (k) => k), 'a');
  // 7) prazni ključevi
  assert.throws(() => new KeyRing(' , '));
  console.log('keyring: OK');
})().catch((e) => { console.error(e); process.exit(1); });
