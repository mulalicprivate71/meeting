# Zapisnici sastanaka — IDSS i IMH

Prototip rješenja za snimanje sastanaka, obradu snimka i zapisnik u propisanom obliku (obrasci QP 10.ZS-01 i QP 10.ZS-02, procedura QP 10).

- `app/` — aplikacija (`index.src.html` je izvor, `index.html` je sastavljen jedan fajl s ugrađenim memorandumima), `UPUTE.md`
- `firestore.rules`, `firebase.json` — Firebase pravila i postavke (besplatni plan Spark); Gemini se poziva iz preglednika (`app/gemini-klijent.js`, rotacija 5 ključeva)
- `probni-razgovor/` — izmišljeni sastanak za probu i očekivani rezultat
- `forms/` — obrasci ZS-01 (IDSS, IMH) i ZS-02 (zajednički sastanak uprave)
- `docs/` — nacrt procedure QP 10 i primjer izvoza s probnim podacima
- `build/` — skripte koje prave obrasce i sastavljaju `index.html` (`build_tpl.py`); `build/att` su memorandumi. Pokretanje: `python3 build/build.py`, `python3 build/build_qp.py`, `python3 build/build_tpl.py` (potrebni Python 3 i `zip`)
- `test/` — Playwright testovi (`node test/t.js` itd.; `t5.js` koristi simulirani Firebase iz `test/firebase-stub.js`; `node test/gemini.test.js` (Gemini i rotacija ključeva))

Status: nije isprobano na stvarnom Firebase projektu (pravila, funkcije, Gemini) ni sa stvarnim snimkom; vidi `app/UPUTE.md`. Repozitorij držati privatnim (sadrži podatke i memorandume škole).
