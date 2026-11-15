const { chromium } = require('playwright');
const base=__dirname+'/';
(async()=>{
 const b=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const ctx=await b.newContext({permissions:['microphone']}); const p=await ctx.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); const dl=[]; p.on('dialog',d=>{dl.push(d.message().slice(0,90));d.accept();});
 await p.route('**/supabase.min.js',r=>r.fulfill({path:base+'stub.js',contentType:'application/javascript'}));
 await p.goto('file://'+base+'mock.html');
 await p.click('nav.tabs button[data-k="novi"]');
 await p.selectOption('#n_sc','IDSS'); await p.fill('#n_tema','T'); await p.fill('#n_mj','M'); await p.fill('#n_pred','P'); await p.fill('#n_uc','A B — x'); await p.fill('#n_dn','Tačka 1');
 await p.click('#n_go'); await p.check('#s_da'); await p.fill('#s_ko','Direktor'); await p.click('#s_sn');
 await p.click('#r_start'); await p.waitForTimeout(3500); await p.click('#r_stop'); await p.waitForTimeout(1500);
 await p.click('#r_next'); await p.waitForSelector('#p_ok',{timeout:15000});
 await p.fill('[data-p="zadaci.0.zadatak"]','Z'); await p.fill('[data-p="zadaci.0.odgovorna"]','O'); await p.fill('[data-p="zadaci.0.rok"]','2026-12-01');
 await p.click('#p_save'); await p.waitForTimeout(500);
 await p.click('#p_ok'); await p.waitForTimeout(1500);
 console.log(await p.evaluate(()=>window.__log));
 console.log('dialogs',dl,'errs',errs);await b.close();
})();
