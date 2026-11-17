const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch();
  const ctx = await b.newContext({acceptDownloads:true, viewport:{width:1100,height:900}});
  const p = await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  p.on('dialog',d=>d.accept());
  // JSZip lokalno (u sandboxu nema pristupa CDN-u)
  await p.route('**/jszip.min.js', r=>r.fulfill({path:require('path').resolve(__dirname,'../app/vendor/jszip.min.js'), contentType:'application/javascript'}));
  await p.goto('file://'+require('path').resolve(__dirname,'../app/index.html'));
  await p.fill('#em','t@idss.ba'); await p.fill('#im','Test Direktor'); await p.click('#go');
  async function novi(sc, tema, dn){
    await p.click('nav.tabs button[data-k="novi"]');
    await p.selectOption('#n_sc',sc);
    await p.fill('#n_tema',tema); await p.fill('#n_mj','Zbornica & kabinet'); await p.fill('#n_pred','Direktor');
    await p.fill('#n_uc','Prvi Učesnik — direktor\nDrugi Đurđević — pedagog');
    await p.fill('#n_dn',dn); await p.selectOption('#n_tip',{index:1}); await p.click('#n_go');
    await p.click('#s_bez');
  }
  async function popuni(zad){
    await p.fill('[data-p="tacke.0.rasprava"]','Prvi red rasprave & <test> $& "navodnici"\nDrugi red rasprave');
    await p.fill('[data-p="tacke.0.zakljucak"]','Usvojeno.');
    await p.fill('[data-p="tacke.0.za"]','5');
    await p.selectOption('[data-p="tacke.0.nacin"]','Javno');
    await p.fill('[data-p="zadaci.0.zadatak"]',zad); await p.fill('[data-p="zadaci.0.odgovorna"]','Prvi Učesnik'); await p.fill('[data-p="zadaci.0.rok"]','2026-12-01');
  }
  async function skini(sel, name){
    const [dl]=await Promise.all([p.waitForEvent('download'), p.click(sel)]);
    await dl.saveAs('out_'+name+'.docx'); console.log('PREUZETO', name, dl.suggestedFilename());
  }
  // 1) IDSS nacrt
  await novi('IDSS','Roditeljski sastanak 5. razreda','Upis\nIzleti');
  await popuni('Pripremiti izlet');
  await skini('#p_docx','idss');
  // 2) zajednički, potvrđen + izvodi
  await novi('ZAJEDNICKI','Planiranje godine','Budžet [IMH]\nNastavni plan [IDSS]\nNabavka');
  await popuni('Pripremiti budžet');
  await p.click('#p_ok'); await p.waitForSelector('#p_dx1');
  await skini('#p_docx','zaj'); await skini('#p_dx1','zaj_imh'); await skini('#p_dx2','zaj_idss');
  // 3) IMH
  await novi('IMH','Sastanak vrtića','Upis djece');
  await popuni('Nabaviti materijal');
  await skini('#p_docx','imh');
  console.log('ERRS:',errs);
  await b.close();
})();
