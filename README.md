# Zapisnici sastanaka — IDSS i IMH

Prototip rješenja za snimanje sastanaka, obradu snimka i zapisnik u propisanom obliku (obrasci QP 10.ZS-01 i QP 10.ZS-02, procedura QP 10).

- `app/` — aplikacija (`index.src.html` je izvor, `index.html` je sastavljen jedan fajl s ugrađenim memorandumima), `schema.sql` (Supabase), `process-meeting/` (serverska funkcija; Gemini ili OpenAI/Anthropic), `UPUTE.md`
- `forms/` — obrasci ZS-01 (IDSS, IMH) i ZS-02 (zajednički sastanak uprave)
- `docs/` — nacrt procedure QP 10 i primjer izvoza s probnim podacima
- `build/` — skripte koje prave obrasce i sastavljaju `index.html` (`build_tpl.py`); `build/att` su memorandumi. Putanje u skriptama upućuju na radni direktorij iz kojeg su nastale i treba ih prilagoditi
- `test/` — Playwright testovi (DEMO i simulirani Supabase)

Status: nije isprobano sa stvarnim Supabase projektom, SQL šemom, funkcijom za obradu i stvarnim snimkom. Repozitorij držati privatnim (sadrži podatke i memorandume škole).
