// DEMO s Gemini ključevima (simulirani Gemini): transkript iz probnog razgovora -> zapisnik; blokada praznog zapisnika; ispis u PDF.
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'); const root=path.resolve(__dirname,'..');
(async()=>{
  const b=await chromium.launch(); const p=await (await b.newContext()).newPage(); const dl=[]; const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>{dl.push(d.message().slice(0,110)); d.accept();});
  const ok=(c,m)=>{ console.log((c?'OK   ':'FAIL ')+m); if(!c) process.exitCode=1; };
  await p.route('https://generativelanguage.googleapis.com/**', async r=>{
    const body=JSON.parse(r.request().postData()); const stt=JSON.stringify(body).includes('inline_data'); const prompt=JSON.stringify(body);
    window_prompt = prompt;
    const txt = JSON.stringify({tacke:[1,2,3,4,5,6].map(i=>({rasprava:'Rasprava tačke '+i,za:i===4?'4':'',protiv:i===4?'0':'',suzdrzani:i===4?'1':'',nacin:i===4?'Javno':'Bez glasanja',zakljucak:'Zaključak '+i,izdvojeno:''})),zadaci:[{zadatak:'Prijavna forma',odgovorna:'Selma Begović',rok:'2026-11-27'}],naredni:'7. 12. 2026.'});
    r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({candidates:[{content:{parts:[{text:txt}]},finishReason:'STOP'}]})});
  });
  let window_prompt='';
  await p.goto('file://'+path.join(root,'app/index.html'));
  await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go');
  ok(await p.isVisible('nav.tabs button[data-k="postavke"]'),'kartica Postavke u DEMO načinu');
  // novi sastanak: obavezna vrsta
  await p.click('nav.tabs button[data-k="novi"]');
  await p.selectOption('#n_sc','ZAJEDNICKI'); await p.fill('#n_tema','Probni'); await p.fill('#n_mj','Kancelarija'); await p.fill('#n_pred','Tarik Mehić'); await p.fill('#n_zap','Selma Begović');
  await p.fill('#n_uc','Tarik Mehić — direktor\nSelma Begović — office manager'); 
  await p.fill('#n_dn','dani otvorenih vrata [zajedničko]\nzimski bazar [IMH]\ndežurstva [IDSS]\nnabavka [zajedničko]\nsavjetodavni sat [zajedničko]\nrazno [zajedničko]');
  await p.click('#n_go'); ok(dl.some(x=>x.includes('Izaberite vrstu')),'bez vrste sastanka se ne nastavlja');
  await p.selectOption('#n_tip','Redovni sastanak uprave'); await p.selectOption('#n_pov','Strogo povjerljivo'); await p.click('#n_go');
  await p.check('#s_da'); await p.fill('#s_ko','Selma'); await p.click('#s_bez');
  await p.waitForSelector('#p_ok');
  await p.click('#p_ok'); ok(dl.some(x=>x.includes('ne može potvrditi')),'prazan zapisnik se ne može potvrditi');
  ok((await p.inputValue('[data-p="tacke.0.rasprava"]'))==='','prazna tačka nema izmišljenog teksta');
  ok((await p.inputValue('[data-p="tacke.0.naslov"]'))==='Dani otvorenih vrata','naslov tačke velikim slovom');
  // Postavke: ključevi + puni tok s transkriptom
  await p.click('nav.tabs button[data-k="postavke"]'); await p.fill('#g_k','k1,k2'); await p.click('#g_s');
  await p.click('nav.tabs button[data-k="novi"]');
  await p.selectOption('#n_sc','ZAJEDNICKI'); await p.fill('#n_tema','Probni 2'); await p.fill('#n_mj','Kancelarija'); await p.fill('#n_pred','Tarik Mehić'); await p.fill('#n_zap','Selma Begović');
  await p.fill('#n_uc','Tarik Mehić — direktor\nSelma Begović — office manager');
  await p.fill('#n_dn','dani otvorenih vrata [zajedničko]\nzimski bazar [IMH]\ndežurstva [IDSS]\nnabavka [zajedničko]\nsavjetodavni sat [zajedničko]\nrazno [zajedničko]');
  await p.selectOption('#n_tip','Redovni sastanak uprave'); await p.selectOption('#n_pov','Strogo povjerljivo'); await p.click('#n_go');
  await p.check('#s_da'); await p.fill('#s_ko','Selma'); await p.click('#s_sn');
  await p.fill('#r_tr', fs.readFileSync(path.join(root,'probni-razgovor/razgovor_transkript.txt'),'utf8')); await p.click('#r_next');
  await p.waitForSelector('#p_ok',{timeout:15000});
  ok((await p.inputValue('[data-p="tacke.3.rasprava"]'))==='Rasprava tačke 4','nacrt iz Geminija u DEMO načinu (strogo povjerljivo ne blokira)');
  ok(/Datum sastanka: 20\d\d-\d\d-\d\d/.test(window_prompt) && window_prompt.includes('Selma Begović (office manager)'),'model dobija datum i listu prisutnih');
  await p.fill('[data-p="broj"]','ZS-1/2026').catch(()=>{});
  await p.click('#p_ok'); await p.waitForTimeout(500);
  ok((await p.textContent('#main')).includes('zaključan'),'potvrđen i zaključan');
  await p.evaluate(()=>{ window.print=()=>{}; ispis(S.meetings.find(x=>x.status==='potvrdjen')); });
  await p.pdf({path:path.join(__dirname,'ispis.pdf'),preferCSSPageSize:true,printBackground:true});
  await b.close();
  console.log('dialogs',dl,'errs',errs);
})();
