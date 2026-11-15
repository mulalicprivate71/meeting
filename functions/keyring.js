'use strict';
// Rotacija više Gemini ključeva: ključevi se uzimaju redom (round-robin); kad ključ vrati grešku
// zbog ograničenja (429/5xx) ili je neispravan, odmara se i poziv se ponavlja s idućim ključem.
// Ključevi se nikad ne upisuju u dnevnik; bilježi se samo redni broj ključa.

class KeyRing {
  constructor(raw, now = () => Date.now()) {
    this.keys = String(raw || '').split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean);
    if (!this.keys.length) throw new Error('Nema postavljenih Gemini ključeva.');
    this.now = now;
    this.next = Math.floor(Math.random() * this.keys.length);
    this.restUntil = new Array(this.keys.length).fill(0);
    this.dead = new Array(this.keys.length).fill(false);
  }

  // Uzmi idući raspoloživi ključ (ne odmara se i nije neispravan); inače onaj čiji odmor prije ističe.
  pick(excluded) {
    const n = this.keys.length;
    const t = this.now();
    for (let k = 0; k < n; k++) {
      const i = (this.next + k) % n;
      if (excluded.has(i) || this.dead[i] || this.restUntil[i] > t) continue;
      this.next = (i + 1) % n;
      return i;
    }
    let best = -1;
    for (let i = 0; i < n; i++) {
      if (excluded.has(i) || this.dead[i]) continue;
      if (best < 0 || this.restUntil[i] < this.restUntil[best]) best = i;
    }
    if (best >= 0) this.next = (best + 1) % n;
    return best;
  }

  // fn(key, index) mora baciti grešku s poljem status (HTTP kod) kad poziv ne uspije.
  async run(fn) {
    const tried = new Set();
    let last;
    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      const i = this.pick(tried);
      if (i < 0) break;
      tried.add(i);
      try {
        return await fn(this.keys[i], i);
      } catch (e) {
        last = e;
        const s = e && e.status;
        if (s === 429) this.restUntil[i] = this.now() + 60_000;
        else if (s === 500 || s === 502 || s === 503 || s === 504 || e.name === 'TimeoutError') this.restUntil[i] = this.now() + 15_000;
        else if (s === 401 || s === 403 || (s === 400 && e.keyInvalid)) this.dead[i] = true;
        else throw e; // greška zahtjeva (npr. neispravan sadržaj): drugi ključ je neće riješiti
        console.warn(`Gemini ključ #${i + 1} nije uspio (status ${s || e.name}); pokušavam idući.`);
      }
    }
    throw last || new Error('Nijedan Gemini ključ nije raspoloživ.');
  }
}

module.exports = { KeyRing };
