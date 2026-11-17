const { chromium } = require('playwright');
p0=0;
(async()=>{ const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:375,height:800}})).newPage();
require('fs');p.on('dialog',d=>d.accept());await p.goto('file://'+require('path').resolve(__dirname,'../app/index.html'));
await p.fill('#em','t@idss.ba'); await p.fill('#im','T'); await p.click('#go');
for (const k of ['novi','arhiva']){ await p.click(`nav.tabs button[data-k="${k}"]`);
 console.log(k, await p.evaluate(()=>{const w=innerWidth;return [document.documentElement.scrollWidth,[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>w+1).slice(0,5).map(e=>e.tagName+'#'+e.id+'.'+e.className)]}));}

await p.click('nav.tabs button[data-k="novi"]'); await p.selectOption('#n_sc','ZAJEDNICKI'); await p.fill('#n_tema','T'); await p.fill('#n_mj','M'); await p.fill('#n_pred','P'); await p.fill('#n_uc','A B — x'); await p.fill('#n_dn','A\nB'); await p.selectOption('#n_tip',{index:1}); await p.click('#n_go'); await p.click('#s_bez');
console.log('pregled', await p.evaluate(()=>{const w=innerWidth;return [document.documentElement.scrollWidth,[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>w+1).slice(0,8).map(e=>e.tagName+'#'+e.id+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))]}));
await b.close();})();
