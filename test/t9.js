// Rok čuvanja (DEMO): istekli, blizu isteka i svježi zapisnici; uništavanje.
const { chromium } = require('playwright'); const path=require('path'); const root=path.resolve(__dirname,'..');
(async()=>{
  const b=await chromium.launch(); const p=await (await b.newContext()).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
  const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  await p.goto('file://'+path.join(root,'app/index.html')); await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go');
  const dan=864e5, iso=n=>new Date(Date.now()-n*dan).toISOString();
  await p.evaluate(([a,b2,c,d])=>{ const mk=(id,t,k)=>({id,scope:'IDSS',status:k?'potvrdjen':'nacrt',tema:t,tip:'Sastanak',datum:'2025-01-01',povjerljivost:'Opći',potvrdjenoKada:k||'',created:new Date().toISOString(),tacke:[],zadaci:[],prisutni:[]});
    localStorage.setItem('zs_meetings',JSON.stringify([mk('a','ISTEKAO',a),mk('b','BLIZU',b2),mk('c','SVJEZ',c),mk('d','NACRT STARI',null)])); },[iso(366),iso(350),iso(10),0]);
  await p.reload(); await p.waitForTimeout(500); if(await p.isVisible('#em')){ await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go'); }
  await p.click('nav.tabs button[data-k="arhiva"]'); await p.waitForTimeout(300);
  ok(await p.locator('[data-x]').count()===1,'dugme za uništavanje samo za istekli zapisnik');
  ok((await p.innerText('#main')).includes('Rok čuvanja je istekao'),'oznaka isteklog roka');
  ok((await p.innerText('#main')).includes('Rok čuvanja ističe'),'oznaka bliskog isteka');
  await p.click('[data-x]'); await p.waitForTimeout(500);
  const t=await p.innerText('#main'); ok(!t.includes('ISTEKAO')&&t.includes('BLIZU')&&t.includes('SVJEZ')&&t.includes('NACRT STARI'),'uništen samo istekli');
  ok(!(await p.evaluate(()=>localStorage.getItem('zs_meetings'))).includes('ISTEKAO'),'uklonjen i iz pohrane');
  ok(errs.length===0,'nema JS grešaka '+errs.join('|'));
  await b.close();
})();
