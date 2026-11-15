#!/usr/bin/env node
// Dodjela uloga korisniku (administrator). Pokretanje iz mape projekta, uz prijavu: `firebase login` i
// `gcloud auth application-default login`, ili GOOGLE_APPLICATION_CREDENTIALS na ključ servisnog računa.
//   node tools/add-member.js direktor@idss.ba "Ime Prezime" IMH=direktor IDSS=direktor
//   node tools/add-member.js pedagog@idss.ba "Ime Prezime" IDSS=clan
// Uloge: direktor | uprava | voditelj | clan. Korisnik mora već postojati u Firebase Authentication.
const path = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));
const [email, ime, ...pairs] = process.argv.slice(2);
if (!email || !ime || !pairs.length) { console.error('Upotreba: node tools/add-member.js <e-pošta> "<Ime Prezime>" IMH=<uloga> IDSS=<uloga>'); process.exit(2); }
const ROLES = ['direktor', 'uprava', 'voditelj', 'clan'];
const data = { ime };
for (const p of pairs) {
  const [inst, r] = p.split('=');
  if (!['IMH', 'IDSS'].includes(inst) || !ROLES.includes(r)) { console.error('Neispravno: ' + p); process.exit(2); }
  data[inst] = r;
}
admin.initializeApp();
(async () => {
  const u = await admin.auth().getUserByEmail(email);
  await admin.firestore().doc(`memberships/${u.uid}`).set(data);
  console.log('Upisano za', email, data);
})().catch((e) => { console.error(e.message); process.exit(1); });
