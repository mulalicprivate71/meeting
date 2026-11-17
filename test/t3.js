const { chromium } = require('playwright');
const base=require('path').resolve(__dirname,'..')+'/';
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({acceptDownloads:true, viewport:{width:375,height:800}});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  const dlg=[]; p.on('dialog',d=>{dlg.push(d.message().slice(0,80)); d.accept();});
  await p.goto('file://'+base+'app/index.html');
  const X='<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>"\'&amp;';
  await p.fill('#em','t@idss.ba'); await p.fill('#im',X); await p.click('#go');
  await p.click('nav.tabs button[data-k="novi"]');
  await p.selectOption('#n_sc','ZAJEDNICKI');
  await p.fill('#n_tema',X+'\u0001\u0008\ud800 kraj'); await p.fill('#n_mj',X); await p.fill('#n_pred',X);
  const uc=[]; for(let i=0;i<160;i++) uc.push('Osoba '+i+' — uloga '+i+' '+X);
  await p.fill('#n_uc',uc.join('\n'));
  const dn=[]; for(let i=0;i<70;i++) dn.push('Tačka '+i+' '+X+' ['+['IMH','IDSS','zajedničko'][i%3]+']');
  await p.fill('#n_dn',dn.join('\r\n'));
  await p.selectOption('#n_tip',{index:1}); await p.click('#n_go'); await p.click('#s_bez');
  await p.fill('[data-p="tacke.0.rasprava"]',X+'\r\nred\u0000\u000b\t tab 😀 \ud83d');
  await p.fill('[data-p="zadaci.0.zadatak"]',X); 
  for(let i=0;i<80;i++){ await p.click('[data-add="zadaci"]'); }
  console.log('XSS flag', await p.evaluate(()=>window.__xss));
  const ov = await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
  console.log(await p.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('table')).slice(0,6).map(e=>e.tagName+'#'+e.id+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right)))); console.log('mobile horizontal overflow', ov, await p.evaluate(()=>document.documentElement.scrollWidth));
  const [dl]=await Promise.all([p.waitForEvent('download'), p.click('#p_docx')]);
  await dl.saveAs('out_stress.docx'); console.log('DOCX', dl.suggestedFilename());
  // arhiva
  await p.click('nav.tabs button[data-k="arhiva"]');
  console.log('XSS flag after arhiva', await p.evaluate(()=>window.__xss));
  console.log('dialogs',dlg); console.log('ERRS',errs);
  await b.close();
})();
