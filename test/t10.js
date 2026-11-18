// Rok čuvanja (simulirani Firebase): brisanje samo isteklog potvrđenog zapisnika; zapis o uništenju.
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'); const root=path.resolve(__dirname,'..');
(async()=>{
  const html=fs.readFileSync(path.join(root,'app/index.html'),'utf8').replace('const FIREBASE_CONFIG = {apiKey:""','const FIREBASE_CONFIG = {apiKey:"test"'); fs.writeFileSync(path.join(__dirname,'mock.html'),html);
  const b=await chromium.launch(); const p=await (await b.newContext()).newPage(); const errs=[],dl=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{dl.push(d.message().slice(0,80));d.accept();});
  const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  await p.route('**/firebase-*-compat.js', r=>r.fulfill({path:path.join(__dirname,'firebase-stub.js'),contentType:'application/javascript'}));
  await p.addInitScript(()=>{ const mk=(id,iso,t)=>{ window.__seed=window.__seed||[]; window.__seed.push([id,iso,t]); }; mk('old','2025-01-01T10:00:00.000Z','STARI'); mk('new',new Date().toISOString(),'NOVI'); });
  await p.goto('file://'+path.join(__dirname,'mock.html'));
  await p.evaluate(()=>{ window.__seed.forEach(([id,iso,t])=>{ window.__docs['meetings/'+id]={scope:'IDSS',status:'potvrdjen',conf:false,createdBy:'u-1',createdAt:'T0',rev:3,confirmedBy:'u-1',confirmedAt:iso.startsWith('2025')?iso:'T9',
    podaci:{id,scope:'IDSS',status:'potvrdjen',tema:t,tip:'Sastanak',datum:iso.slice(0,10),povjerljivost:'Opći',created:iso,potvrdjenoKada:iso,tacke:[],zadaci:[],prisutni:[]}};
    window.__docs['meetings/'+id+'/consents/main']={givenBy:'x'}; window.__docs['meetings/'+id+'/audit/a1']={action:'x'}; }); });
  await p.fill('#em','direktor@idss.ba'); await p.fill('#pw','ok'); await p.click('#go'); await p.waitForSelector('nav.tabs');
  await p.click('nav.tabs button[data-k="arhiva"]'); await p.waitForTimeout(400);
  ok(await p.locator('[data-x]').count()===1,'samo istekli zapisnik nudi uništavanje');
  await p.click('[data-x]'); await p.waitForTimeout(700);
  const k=await p.evaluate(()=>Object.keys(window.__docs));
  ok(!k.some(x=>x.startsWith('meetings/old')),'zapisnik i podkolekcije obrisani');
  ok(k.includes('meetings/new')&&k.includes('meetings/new/consents/main'),'svjež zapisnik netaknut');
  const dz=await p.evaluate(()=>window.__docs['destroyed/old']);
  ok(dz&&dz.meetingId==='old'&&!JSON.stringify(dz).includes('STARI'),'zapis o uništenju bez teme');
  // neistekli: brisanje direktno mora biti odbijeno
  const r=await p.evaluate(async()=>{ try{ await firebase.firestore().collection('meetings').doc('new').delete(); return 'obrisan'; }catch(e){ return e.code; } });
  ok(r==='permission-denied','neistekli zapisnik se ne može obrisati ('+r+')');
  ok(errs.length===0,'nema JS grešaka '+errs.join('|'));
  await b.close();
})();
