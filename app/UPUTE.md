# Zapisnici sastanaka — prototip

Sadržaj:
- `index.html` — aplikacija (jedan fajl; sadrži i memorandume IDSS i IMH za DOCX izvoz)
- `schema.sql` — baza, uloge i pravila pristupa (Supabase)
- `process-meeting/index.ts` — serverska funkcija za obradu snimka

## 1. Isprobavanje odmah (DEMO)
Otvorite `index.html` u pregledniku (Chrome, Edge ili Safari). Prijavite se bilo kojom e-poštom i imenom.
Tok: Novi sastanak → saglasnost → snimanje (ili učitavanje audija) → obrada → pregled → potvrda → arhiva → izvoz.
U DEMO načinu podaci ostaju samo u tom pregledniku, nema zaštite pristupa i nema prepoznavanja govora
(nacrt se pravi iz dnevnog reda, a ništa se ne izmišlja).

## Izvoz u DOCX (uredivo)
Na ekranu pregleda dugme „Preuzmi DOCX (uredivo)“ pravi Word dokument na memorandumu ustanove (IDSS ili IMH) u
rasporedu obrasca QP 10.ZS-01. Za zajednički sastanak uprave pravi se obrazac QP 10.ZS-02 (IDSS memorandum, u podnožju
oba naziva), a nakon potvrde i izvodi za IMH ili IDSS. Dokument se može dalje uređivati u Wordu. Nacrt se
preuzima s oznakom „_NACRT“ u nazivu fajla. Izvoz radi i bez interneta (biblioteka je ugrađena u fajl).

## 2. Povezivanje sa Supabase (stvarni rad)
1. Napravite NOVI Supabase projekat (odvojen od aplikacije IDSS Pedagog).
2. U SQL editoru pokrenite `schema.sql`.
3. Dodajte korisnike (Authentication) i upišite njihova članstva i uloge u tabelu `memberships`
   (ustanova IMH ili IDSS; uloga direktor / uprava / voditelj / clan). Zapisnike potvrđuje samo `direktor`
   (za zajednički sastanak direktor obje ustanove). Zajedničke sastanke vide samo osobe s ulogom
   `uprava` ili `direktor` u OBJE ustanove.
4. Objavite funkciju: `supabase functions deploy process-meeting`, a tajne postavite sa
   `supabase secrets set GEMINI_API_KEY=… STT_PROVIDER=gemini LLM_PROVIDER=gemini`
   (Google Gemini za prepoznavanje govora i izradu nacrta; model se može zadati s `GEMINI_MODEL`, zadano `gemini-2.5-flash` —
   važeći naziv provjeriti u Googleovoj dokumentaciji). Zamjenski način: `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` s
   `STT_PROVIDER=openai LLM_PROVIDER=anthropic`. Gemini adapter nije isprobavan; zapis za obradu do ~15 MB.
5. Sastanci označeni „Strogo povjerljivo“ se po zadanim postavkama NE šalju vanjskim servisima (zapisnik se piše ručno).
   Ako Direktor odluči drukčije: `supabase secrets set ALLOW_CONFIDENTIAL_EXTERNAL=true`.
6. U `index.html` upišite `SUPABASE_URL` i `SUPABASE_ANON_KEY`.
7. Postavite fajl na hosting (npr. Supabase Storage, Netlify ili školski server). Mikrofon radi samo na HTTPS adresi.

## 3. Šta je provjereno, a šta nije
Provjereno automatskim testovima u pregledniku (DEMO način): prijava, priprema, saglasnost, snimanje s mikrofonom,
nacrt, upozorenja prije potvrde, potvrda i zaključavanje, izvod za IMH, arhiva, DOCX izvoz za IDSS, IMH, zajednički
sastanak i oba izvoda (valjani Word format, ispravan prikaz). Stres test: zlonamjerni unos (HTML/skripta) ne izvršava se
ni u aplikaciji ni u DOCX-u, nedozvoljeni znakovi se čiste, 160 učesnika / 70 tačaka / 80 zadataka izvozi se bez greške,
telefonski ekran (375 px) bez vodoravnog klizanja. Tok sa SIMULIRANIM Supabase klijentom: svi prelazi statusa odgovaraju
šemi, snimak se otprema, nakon potvrde se poziva brisanje.
Nije provjereno: rad sa stvarnim Supabase projektom, izvršavanje SQL šeme, izvršavanje funkcije (Deno), kvalitet
prepoznavanja bosanskog jezika, rad na telefonu (iPhone prekida snimanje kad se ekran zaključa), otvaranje DOCX fajlova
u samom programu Word (provjereno programom LibreOffice i alatom za provjeru formata).

## 4. Poznata ograničenja
- Serveri za prepoznavanje govora imaju ograničenje veličine zapisa (oko 25 MB); duži sastanci traže dijeljenje.
- Razdvajanje govornika nije ugrađeno; dodaje se kad se izabere servis.
- Brisanje snimka: aplikacija ga poziva odmah nakon potvrde; ako ne uspije, na zapisniku postoji dugme „Obriši snimak“.
- Zapisnik može potvrditi samo osoba s ulogom `direktor` (odluka Direktora, QP 10).
