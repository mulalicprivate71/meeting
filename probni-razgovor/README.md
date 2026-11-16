# Probni razgovor za testiranje

Izmišljeni sastanak (osobe i događaji su izmišljeni). Služi za provjeru cijelog toka: snimanje → transkript → nacrt zapisnika → izvoz.

## 1. Podaci za unos (ekran „Novi sastanak“)

| Polje | Vrijednost |
|---|---|
| Ustanova | Zajednički sastanak uprave (IMH + IDSS) |
| Vrsta | Redovni sastanak uprave |
| Tema | Zajednički sastanak uprave – novembar 2026. |
| Mjesto | Direktorova kancelarija |
| Predsjedavajući | Tarik Mehić |
| Zapisničar | Selma Begović |
| Datum / vrijeme | 16. 11. 2026., 10:05–10:52 |
| Povjerljivost | **Opći** (jedino tako se šalje besplatnom Geminiju; sastanak je izmišljen, bez ličnih podataka) |

**Učesnici (jedan red = jedna osoba):**
```
Tarik Mehić — direktor
Lejla Hadžić — osnivačica
Selma Begović — office manager
Amra Delić — pedagog
Emina Šabanović — psiholog
```

**Dnevni red (oznaka ustanove u uglastim zagradama):**
```
Dani otvorenih vrata i upis za 2027/28. [zajedničko]
Zimski bazar i priredba u vrtiću [IMH]
Dežurstva i zamjene u decembru [IDSS]
Nabavka didaktičkog materijala i budžet [zajedničko]
Savjetodavni sat za roditelje [zajedničko]
Razno [zajedničko]
```

## 2. Kako testirati
- **Bez snimanja:** zalijepite sadržaj `razgovor_transkript.txt` u polje „Zalijepite transkript“ (u DEMO načinu nacrt se ne razvrstava; ovo služi samo za priloženi transkript).
- **S pravim snimkom (Firebase + Gemini):** snimite čitanje teksta (pet osoba čita svoje redove; dovoljno je i jedna osoba koja mijenja glas, ali bolje pet). Trajanje oko 7 minuta. Zatim ga obradite u aplikaciji i uporedite s očekivanim rezultatom ispod.

## 3. Očekivani rezultat

**Glasanje (tačka 4):** 4 za, 0 protiv, 1 suzdržan; javno. Izdvojeno mišljenje (Selma): želi uporediti još jednu ponudu (štamparija).

| Tačka | Zaključak |
|---|---|
| 1 | Zajednički dan otvorenih vrata: subota, 23. januar 2027., 10–12 h |
| 2 | Zimski bazar 12. decembra; priredba 17. decembra u 16 h |
| 3 | Dežurstva 7–11. decembra preuzimaju ostali, zamjena se vraća slobodnim danom |
| 4 | Nabavka do 3.250 KM (1.800 KM vrtić, 1.450 KM škola) usvojena |
| 5 | Pilot savjetodavnog sata: utorkom 14–15 h, od 1. decembra do kraja januara, zatim evaluacija |
| 6 | Izlet sedmih razreda: bez odluke; ponude do idućeg sastanka |

**Zadaci:**

| Zadatak | Odgovorna | Rok | Oznaka |
|---|---|---|---|
| Napraviti prijavnu formu i poslati poziv roditeljima | Selma | 27. 11. 2026. | zajedničko |
| Napisati tekst poziva i poslati ga Selmi | Lejla | **prazno** („do srijede“ nije tačan datum) | zajedničko |
| Napraviti kartice sa sastojcima | Selma | 10. 12. 2026. | IMH |
| Napisati obavještenje o alergijama | Emina | **prazno** („prije bazara“) | IMH |
| Napraviti novi raspored dežurstava i poslati ga | Amra | **prazno** („do petka“) | IDSS |
| Objaviti raspored na oglasnoj tabli i u grupi | Selma | prazno | IDSS |
| Uporediti drugu ponudu; narudžba najkasnije do 23. 11. | Selma | 23. 11. 2026. | zajedničko |
| Provjeriti uslove povrata robe | **niko nije preuzeo** | prazno | zajedničko |
| Napisati koncept obavještenja o savjetodavnom satu | Emina | 25. 11. 2026. | zajedničko |
| Donijeti dvije ponude za izlet | Amra | 7. 12. 2026. | zajedničko |

Aplikacija pri potvrdi mora upozoriti na zadatke bez roka i bez odgovorne osobe.

**Naredni sastanak:** 7. decembar 2026., 10 h, ista kancelarija.

## 4. Zamke (provjera da model ne griješi)
1. **Ispravka naglas:** „do dvadeset osmog… ne, čekaj, to je subota. Do dvadeset sedmog“ → rok 27. 11.
2. **Ispravka iznosa:** 3.200 KM → 3.250 KM (s dostavom). Smije se upisati samo 3.250 KM.
3. **Ime dobavljača nije izgovoreno** („firma iz Zenice“) → ne smije se izmisliti naziv.
4. **Šala o povišici** („upiši da smo svi dobili povišicu“) → ne smije ući u zapisnik ni kao zaključak ni kao zadatak.
5. **Pojedinačni slučajevi:** psiholog izričito ne govori o njima → ništa o tome u zapisniku.
6. **Neodređeni rokovi** („do srijede“, „do petka“, „prije bazara“) → polje roka prazno, rok naveden u tekstu zadatka.
7. **Zadatak bez odgovorne osobe** („neko da pogleda uslove povrata… vidjećemo“).
8. **Sporedni razgovor** (kafa, voda) → izostaviti.
9. **Jezik zapisnika:** književni bosanski (latinica), bez kolokvijalizama („frka“, „kontam“, „džaba“) i bez srbizama i hrvatizama.
10. **Izvodi:** izvod za IMH smije sadržavati tačke 1, 2, 4, 5, 6 (zajedničke i IMH), ali **ne tačku 3 (IDSS)**; izvod za IDSS obrnuto (ne tačku 2).
