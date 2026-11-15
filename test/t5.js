// Tok s SIMULIRANIM Firebase klijentom: prijava, uloge, snimanje, obrada, potvrda, brisanje snimka, konflikt, greške.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const root = path.resolve(__dirname, '..');
(async()=>{
  const html = fs.readFileSync(path.join(root,'app/index.html'),'utf8').replace('const FIREBASE_CONFIG = {apiKey:""','const FIREBASE_CONFIG = {apiKey:"test"');
  fs.writeFileSync(path.join(__dirname,'mock.html'), html);
  const b = await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const ctx = await b.newContext({permissions:['microphone']}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); const dl=[]; p.on('dialog',d=>{dl.push(d.message().slice(0,100));d.accept();});
  await p.route('**/firebase-*-compat.js', r=>r.fulfill({path:path.join(__dirname,'firebase-stub.js'),contentType:'application/javascript'}));
  await p.goto('file://'+path.join(__dirname,'mock.html'));
  const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  await p.fill('#em','direktor@idss.ba'); await p.fill('#pw','kriva'); await p.click('#go');
  ok((await p.textContent('#perr')).includes('pogrešna'), 'pogrešna lozinka se prijavljuje');
  await p.fill('#pw','ok'); await p.click('#go'); await p.waitForSelector('nav.tabs');
  ok((await p.textContent('#who')).includes('Direktor Test'), 'ime iz članstva');
  await p.click('nav.tabs button[data-k="novi"]');
  await p.selectOption('#n_sc','IDSS'); await p.fill('#n_tema','T'); await p.fill('#n_mj','M'); await p.fill('#n_pred','P'); await p.fill('#n_uc','A B — x'); await p.fill('#n_dn','Tačka 1');
  await p.click('#n_go'); await p.check('#s_da'); await p.fill('#s_ko','Direktor'); await p.click('#s_sn');
  await p.click('#r_start'); await p.waitForTimeout(3500); await p.click('#r_stop'); await p.waitForTimeout(1500);
  await p.click('#r_next'); await p.waitForSelector('#p_ok',{timeout:15000});
  await p.fill('[data-p="zadaci.0.zadatak"]','Z'); await p.fill('[data-p="zadaci.0.odgovorna"]','O'); await p.fill('[data-p="zadaci.0.rok"]','2026-12-01');
  await p.fill('[data-p="predsjedavajuci"]','P').catch(()=>{}); 
  await p.click('#p_save'); await p.waitForTimeout(400);
  await p.click('#p_ok'); await p.waitForTimeout(1500);
  const log = await p.evaluate(()=>window.__log);
  console.log(log.join(' | '));
  ok(log.some(x=>x.startsWith('create saglasnost')), 'kreiran sa statusom saglasnost');
  ok(log.includes('add meetings/'+log.length+'') || log.some(x=>x.startsWith('add meetings/')), 'saglasnost evidentirana');
  ok(log.some(x=>x.startsWith('upload 00001')), 'komad snimka otpremljen');
  ok(log.some(x=>x==='fn processMeeting europe-west1'), 'funkcija obrade pozvana u regiji europe-west1');
  ok(log.some(x=>x==='tx potvrdjen<-nacrt'), 'potvrda kroz transakciju nacrt->potvrdjen');
  ok(log.some(x=>x==='fn purgeRecording europe-west1'), 'brisanje snimka nakon potvrde');
  ok(!log.some(x=>x.includes('BAD')), 'nema nedozvoljenih prelaza');
  // zaključan nakon potvrde: izmjena odbijena
  const r = await p.evaluate(async()=>{ const m=S.meetings[0]; try{ m.tema='x'; await store.save(m); return 'sacuvano'; }catch(e){ return e.message; } });
  ok(/zaključan|pravo/.test(r), 'izmjena potvrđenog odbijena: '+r);
  // konflikt: lažna izmjena revizije
  await p.click('nav.tabs button[data-k="novi"]');
  await p.selectOption('#n_sc','IDSS'); await p.fill('#n_tema','K'); await p.fill('#n_mj','M'); await p.fill('#n_pred','P'); await p.fill('#n_uc','A B — x'); await p.fill('#n_dn','Tačka');
  await p.click('#n_go'); await p.click('#s_bez'); await p.waitForTimeout(500);
  const k = await p.evaluate(async()=>{ const m=S.meetings.find(x=>x.tema==='K')||S.cur; m._rev=m._rev+5; try{ await store.save(m); return 'sacuvano'; }catch(e){ return e.message; } });
  ok(/međuvremenu/.test(k), 'konflikt revizije prijavljen: '+k);
  // ulogu bez članstva
  const lst = await p.evaluate(async()=>{ S.mem={IDSS:'clan'}; S.user.id='u-1'; try{ const l=await store.list(); return l.length; }catch(e){ return e.message; } });
  ok(typeof lst==='number', 'lista za člana radi (dva upita po ustanovi)');
  ok(errs.length===0, 'nema JS grešaka '+JSON.stringify(errs));
  console.log('dialogs',dl);
  await b.close();
})();
