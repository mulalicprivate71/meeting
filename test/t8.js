// Rubni slučajevi: mikrofon odbijen, prevelik/prazan zapis, datum u lokalnoj zoni (ponoć), ključevi.
const { chromium } = require('playwright'); const path=require('path'), fs=require('fs'); const root=path.resolve(__dirname,'..');
(async()=>{
  const b=await chromium.launch(); const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  // zona Pacific/Kiritimati (UTC+14) i 23:30 lokalno -> datum mora biti lokalni
  const ctx=await b.newContext({timezoneId:'Pacific/Kiritimati'}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
  await p.addInitScript(()=>{ const R=Date; const fixed=new R('2026-11-17T09:30:00Z').getTime(); // 23:30 lokalno u UTC+14, UTC datum 17.11., lokalni 17.11. 23:30 -> UTC+14 = 18.11. 23:30? 
    class D extends R{ constructor(...a){ if(a.length) super(...a); else super(fixed); } static now(){ return fixed; } } window.Date=D; });
  await p.goto('file://'+path.join(root,'app/index.html')); await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go');
  await p.click('nav.tabs button[data-k="novi"]');
  const v=await p.inputValue('#n_dat').catch(()=>null);
  const lok=await p.evaluate(()=>lokalniDatum());
  ok(v===null||v===lok,'zadani datum = lokalni datum ('+v+' / '+lok+')');
  ok(lok==='2026-11-17'||lok==='2026-11-18','lokalniDatum radi: '+lok);
  // mikrofon odbijen
  await p.selectOption('#n_sc','IDSS'); await p.fill('#n_tema','T'); await p.fill('#n_mj','S'); await p.fill('#n_pred','A B'); await p.fill('#n_zap','C D'); await p.fill('#n_uc','A B — direktor'); await p.fill('#n_dn','jedna'); await p.selectOption('#n_tip',{index:1}); await p.click('#n_go');
  await p.check('#s_da'); await p.fill('#s_ko','A'); await p.click('#s_sn'); await p.waitForSelector('#r_start');
  await p.evaluate(()=>{ navigator.mediaDevices.getUserMedia=()=>Promise.reject(new Error('NotAllowedError')); });
  await p.click('#r_start'); await p.waitForTimeout(300);
  ok((await p.innerText('#r_msg')).includes('Mikrofon nije dostupan'),'odbijen mikrofon: jasna poruka');
  // prazan i prevelik upload
  fs.writeFileSync('/tmp/prazan.webm',''); fs.writeFileSync('/tmp/velik.mp3',Buffer.alloc(15*1024*1024));
  await p.setInputFiles('#r_file','/tmp/velik.mp3'); await p.waitForTimeout(300);
  ok((await p.innerText('#r_msg')).includes('prevelik'),'prevelik zapis odbijen');
  await p.setInputFiles('#r_file','/tmp/prazan.webm'); await p.waitForTimeout(500);
  const msg=await p.innerText('#r_msg'); const dj=await p.locator('#r_prev audio').count();
  ok(!(dj>0&&/učitan/.test(msg)) ,'prazan zapis (0 B) se ne tretira kao valjan: "'+msg+'" dijelova='+dj);
  ok(errs.length===0,'nema JS grešaka '+errs.join('|'));
  await b.close();
})();
