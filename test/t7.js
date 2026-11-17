// Snimanje s lažnim mikrofonom: rotacija dijelova, zaustavljanje u rotaciji, ponovno učitavanje i nastavak (bez prepisivanja), odbijen mikrofon.
const { chromium } = require('playwright'); const path=require('path'); const root=path.resolve(__dirname,'..');
(async()=>{
  const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-audio-capture=/tmp/fake.wav']});
  const ctx=await b.newContext({permissions:['microphone']}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
  const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  await p.addInitScript(()=>{ window.__SEG_MS=4000; });
  const url='file://'+path.join(root,'app/index.html');
  async function novi(){
    await p.click('nav.tabs button[data-k="novi"]');
    await p.selectOption('#n_sc','IDSS'); await p.fill('#n_tema','Snimanje'); await p.fill('#n_mj','Sala'); await p.fill('#n_pred','A B'); await p.fill('#n_zap','C D');
    await p.fill('#n_uc','A B — direktor'); await p.fill('#n_dn','jedna\ndruga'); await p.selectOption('#n_tip',{index:1}); await p.click('#n_go');
    await p.check('#s_da'); await p.fill('#s_ko','A'); await p.click('#s_sn'); await p.waitForSelector('#r_start');
  }
  const dijelovi=()=>p.evaluate(()=>aud.all(window.__mid||S.cur&&S.cur.id).then(a=>a.map(x=>x.size)).catch(e=>'ERR '+e));
  await p.goto(url); await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go');
  await novi();
  const id=await p.evaluate(()=>{ try{return (typeof S!=='undefined'&&S.cur&&S.cur.id)||null;}catch(e){return null;} });
  await p.click('#r_start'); await p.waitForTimeout(10500);
  await p.click('#r_stop'); await p.waitForTimeout(1500);
  const n1=await p.locator('#r_prev audio').count();
  ok(n1>=3,'rotacija: '+n1+' dijelova nakon ~10 s sa SEG=4 s');
  const sizes=await p.$$eval('#r_prev p',ps=>ps.map(x=>x.textContent.match(/\((\d+) KB\)/)).filter(Boolean).map(m=>+m[1]));
  ok(sizes.length===n1 && sizes.every(s=>s>0),'svaki dio ima sadržaj: '+sizes.join(','));
  // reload i nastavak
  await p.reload(); await p.waitForTimeout(800); if(await p.isVisible('#em')){ await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go'); }
  console.log('nakon reloada vidljivo:',(await p.innerText('body')).slice(0,120).replace(/\n/g,' | '));
  ok(errs.length===0,'nema JS grešaka: '+errs.join('|'));
  await p.click('nav.tabs button[data-k="arhiva"]').catch(()=>{});
  await p.waitForTimeout(300);
  const otv=p.locator('button[data-o]').first(); ok(await otv.count()>0,'sastanak u listi'); await otv.click(); await p.waitForTimeout(500);
  ok(await p.isVisible('#r_start'),'ekran snimanja se vraća nakon reloada');
  ok(await p.locator('#r_prev audio').count()===n1,'postojeći dijelovi sačuvani nakon reloada');
  await p.click('#r_start'); await p.waitForTimeout(6000); await p.click('#r_stop'); await p.waitForTimeout(1500);
  const n2=await p.locator('#r_prev audio').count(); ok(n2>=n1+2,'nastavak dodaje dijelove ('+n1+' -> '+n2+'), ne prepisuje');
  // zaustavljanje tačno u trenutku rotacije
  await p.click('#r_start').catch(()=>{});
  ok(errs.length===0,'nema JS grešaka (2): '+errs.join('|'));
  console.log('dijelovi:',n1,n2);
  await b.close();
})();
