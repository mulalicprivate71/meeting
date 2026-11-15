# Zapisnici sastanaka — prototip (Firebase + Gemini)

Sadržaj repozitorija:
- `app/index.html` — aplikacija (jedan fajl; sadrži memorandume IDSS i IMH za DOCX izvoz). Izvor je `app/index.src.html`.
- `firestore.rules`, `storage.rules`, `firebase.json` — pravila pristupa i postavke Firebase projekta
- `functions/` — serverske funkcije `processMeeting` i `purgeRecording` (Gemini, rotacija ključeva)
- `tools/add-member.js` — dodjela uloga korisnicima
- `probni-razgovor/` — izmišljeni sastanak za probu i očekivani rezultat

## 1. Isprobavanje odmah (DEMO)
Otvorite `app/index.html` u pregledniku (Chrome, Edge ili Safari), prijavite se bilo kojom e-poštom i imenom.
Podaci ostaju samo u tom pregledniku, nema zaštite pristupa i nema prepoznavanja govora (nacrt se pravi iz dnevnog reda,
ništa se ne izmišlja). DOCX izvoz radi i bez interneta.

## 2. Povezivanje s Firebase (stvarni rad)
Potrebno: Google račun, Node.js 20+, `npm i -g firebase-tools`.

1. U Firebase konzoli napravite NOVI projekat (odvojen od aplikacije IDSS Pedagog) i **pređite na plan Blaze** (plaćanje po potrošnji).
   Blaze je obavezan za Cloud Functions i za novu pohranu (Storage); za ovaj obim potrošnja je mala, a možete postaviti i budžetsko upozorenje.
2. Uključite: **Authentication** (način prijave: e-pošta/lozinka), **Firestore** (izaberite europsku lokaciju, npr. `eur3`; lokacija se kasnije ne može mijenjati) i **Storage** (također europska lokacija).
3. U mapi projekta: `firebase login`, pa kopirajte `.firebaserc.example` u `.firebaserc` i upišite ID projekta.
4. Ključevi za Gemini (svih 5, odvojeni zarezom): `firebase functions:secrets:set GEMINI_API_KEYS`
   (opcionalno naziv modela: u `functions/.env` red `GEMINI_MODEL=...`; zadano `gemini-2.5-flash`, važeći naziv provjeriti u Googleovoj dokumentaciji).
5. `cd functions && npm install && cd ..`, zatim `firebase deploy` (objavljuje pravila, funkcije i aplikaciju).
   Pri prvom objavljivanju pravila za Storage konzola može tražiti odobrenje da Storage čita Firestore — odobrite.
6. Dodajte korisnike u Authentication (konzola), pa im dodijelite uloge:
   `node tools/add-member.js direktor@idss.ba "Ime Prezime" IMH=direktor IDSS=direktor`
   (uloge: direktor / uprava / voditelj / clan). Zapisnike potvrđuje samo `direktor` (za zajednički sastanak direktor obje ustanove).
   Zajedničke sastanke vide samo osobe s ulogom `uprava` ili `direktor` u OBJE ustanove. Bez dodijeljene uloge pristup nije moguć.
7. Aplikacija je tada na adresi `https://<projekat>.web.app` (HTTPS je potreban za mikrofon); postavke Firebase učitava sama.
8. Sastanci označeni „Strogo povjerljivo“ se po zadanim postavkama NE šalju Googleu na obradu (zapisnik se piše ručno).
   Ako Direktor odluči drukčije: u `functions/.env` upišite `ALLOW_CONFIDENTIAL_EXTERNAL=true` i ponovo objavite funkcije.

### Rotacija Gemini ključeva
Funkcija uzima ključeve redom (round-robin). Ako ključ vrati grešku zbog ograničenja (429) ili grešku servera, odmara se 15–60 sekundi i
poziv se ponavlja idućim ključem; neispravan ključ se isključuje. Ključevi se čuvaju kao tajna (Secret Manager) i nikad ne ulaze u dnevnik.
Napomena: ključevi iz istog Google Cloud projekta dijele isto ograničenje, a besplatni nivo može koristiti podatke za poboljšanje modela;
za snimke sastanaka koristite plaćeni nalog i pročitajte Googleove uslove.

## 3. Šta je provjereno, a šta nije
Provjereno automatskim testovima (DEMO i simulirani Firebase klijent): prijava, uloge, priprema, saglasnost, snimanje, obrada,
potvrda kroz transakciju (samo dozvoljeni prelazi statusa), brisanje snimka nakon potvrde, zaključavanje, konflikt izmjena,
DOCX izvoz (IDSS, IMH, zajednički, izvodi), zlonamjerni unos, veliki podaci, telefonski ekran, logika rotacije ključeva.
**Nije provjereno:** pravila `firestore.rules` i `storage.rules` (nisu pokretana u Firebase emulatoru), objavljivanje i rad funkcija,
stvarni Gemini (prepoznavanje bosanskog; otprema duže od 14 MB preko Files API; **prihvata li Gemini format `audio/webm` koji snima Chrome** — ako odbije, treba snimati u drugom formatu ili prekodirati; to je prva stvar za probu s probnim razgovorom), rad na iPhoneu s zaključanim ekranom,
otvaranje DOCX u samom Wordu.

## 4. Poznata ograničenja
- Snimci do ~100 MB (oko 7 sati pri zadanom kvalitetu); duži sastanci traže dijeljenje.
- Razdvajanje govornika radi Gemini okvirno („Govornik 1…“); imena treba provjeriti u pregledu.
- Brisanje snimka: aplikacija ga poziva odmah nakon potvrde; ako ne uspije, na zapisniku postoji dugme „Obriši snimak“.
