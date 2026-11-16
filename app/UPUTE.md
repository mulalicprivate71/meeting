# Zapisnici sastanaka — prototip (Firebase besplatni plan + Gemini)

Sve je potpuno besplatno: Firebase **Spark** plan (prijava, baza, hosting; bez bankovne kartice) i besplatni Gemini ključevi.
Nema Cloud Functions ni Storage (to traži plaćeni plan). Snimak ostaje samo na računaru; u Google ide samo za obradu.

Sadržaj repozitorija:
- `app/index.html` — aplikacija (jedan fajl; sadrži memorandume IDSS i IMH). Izvor: `app/index.src.html`, `app/gemini-klijent.js`, `app/dx.js`.
- `firestore.rules`, `firebase.json` — pravila pristupa i postavke objave
- `probni-razgovor/` — izmišljeni sastanak za probu i očekivani rezultat

## 1. Isprobavanje odmah (DEMO)
Dvaput kliknite `app\index.html`. Prijavite se bilo kojom e-poštom i imenom. Podaci ostaju samo u tom pregledniku, nema zaštite
pristupa i nema prepoznavanja govora (nacrt se pravi iz dnevnog reda, ništa se ne izmišlja). DOCX izvoz radi i bez interneta.

## 2. Pravi rad (Firebase Spark)
Potrebno: Google račun, Node.js (LTS) i u Komandnoj liniji (cmd): `npm install -g firebase-tools`.

1. Na console.firebase.google.com napravite NOVI projekat (ostanite na planu **Spark**; ne uključujte Blaze). Google Analytics nije potreban.
2. Uključite **Authentication** (način prijave: e-pošta/lozinka) i **Firestore** (europska lokacija, npr. `eur3`; kasnije se ne može mijenjati; „production mode“).
   Storage i Functions NE uključujte.
3. Dodajte web aplikaciju (ikona `</>` u Project settings) i zapišite ID projekta.
4. U mapi projekta: `firebase login`, pa `copy .firebaserc.example .firebaserc` i u `.firebaserc` upišite ID projekta.
5. `firebase deploy` (objavljuje pravila i aplikaciju). Adresa: `https://<projekat>.web.app` (HTTPS je potreban za mikrofon; postavke se učitavaju same).
6. U konzoli (Authentication) dodajte korisnike. Zatim u Firestoreu (Data) napravite:
   - zbirku `memberships`: dokument s ID-jem = UID korisnika, polja (tekst): `IMH` = `direktor`, `IDSS` = `direktor`, `ime` = ime i prezime.
     Uloge: `direktor` | `uprava` | `voditelj` | `clan`. Zapisnike potvrđuje samo `direktor` (za zajednički sastanak direktor obje ustanove).
     Zajedničke sastanke vide samo `uprava` ili `direktor` u OBJE ustanove. Bez dokumenta u `memberships` pristup nije moguć.
   - zbirku `config`, dokument `gemini`: polje `keys` (tekst) = svih 5 ključeva odvojenih zarezom. Opcionalno: `model` (zadano `gemini-2.5-flash`; važeći naziv provjeriti u Googleovoj dokumentaciji).

### Rotacija Gemini ključeva
Aplikacija koristi ključeve redom. Ako ključ vrati ograničenje (429) ili grešku servera, odmara se 15–60 sekundi i poziv ide idućim ključem; neispravan ključ se isključuje.
**Sigurnosna napomena:** ključevi se čitaju u pregledniku, pa ih mogu vidjeti osobe s ulogom `direktor` ili `uprava`. Ako neko takav ode, zamijenite ključeve.
Ključevi iz istog Google projekta dijele isto ograničenje.

## 3. Privatnost — odluka Direktora
Direktor je odlučio da se SVI sastanci obrađuju besplatnim Geminijem. Prema Googleovim uslovima, kod besplatnog nivoa (izvan EEA, Švicarske i UK) Google može koristiti poslani sadržaj
za razvoj svojih proizvoda, a ljudi ga mogu pročitati; uslovi kažu da se ne šalju osjetljivi, povjerljivi ni lični podaci. Aplikacija zato nema blokade ni upita pri slanju,
samo ispis na ekranu obrade. Ako se odluka promijeni, vrati se blokada povjerljivih sastanaka ili se pređe na plaćeni nalog.

## 4. Gdje je snimak
Snimak se čuva samo u pregledniku računara na kojem se snima (IndexedDB), dijeli se na dijelove od 20 minuta i šalje se samo Googleu pri obradi.
Briše se nakon potvrde zapisnika (ili dugmetom „Obriši snimak s ovog računara“). Obradu treba pokrenuti na istom računaru i u istom pregledniku na kojem je snimano.
Ako se očisti podaci preglednika prije obrade, snimak je izgubljen. Dijelove možete preuzeti kao rezervnu kopiju.

## 5. Šta je provjereno, a šta nije
Provjereno automatskim testovima (DEMO i simulirani Firebase + simulirani Gemini): prijava, uloge, saglasnost, snimanje, lokalna pohrana, obrada, rotacija ključeva (429),
provjera odgovora modela, potvrda kroz transakciju, brisanje snimka, zaključavanje, konflikt izmjena, DOCX izvoz, zlonamjerni unos, telefonski ekran.
**Nije provjereno:** pravila `firestore.rules` (nisu pokretana u Firebase emulatoru ni na stvarnom projektu), pozivi stvarnom Gemini API-ju iz preglednika
(CORS), prihvata li Gemini format `audio/webm` koji snima Chrome, kvalitet prepoznavanja bosanskog, rad na iPhoneu s zaključanim ekranom, DOCX u samom Wordu.

## 6. Ograničenja
- Jedan dio snimka najviše 14 MB (oko sat vremena; snimanje dijeli samo na 20 minuta). Učitani gotov zapis veći od 14 MB treba podijeliti.
- Besplatni Gemini ima dnevna i minutna ograničenja; kod dugih sastanaka obrada može čekati ili preći na drugi ključ.
- Razdvajanje govornika radi Gemini okvirno („Govornik 1…“); imena treba provjeriti u pregledu.
- Spark plan: 50.000 čitanja i 20.000 upisa dnevno — za ovu upotrebu više nego dovoljno.
