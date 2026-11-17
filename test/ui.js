const { chromium } = require('playwright'); const path=require('path'),fs=require('fs'); const root=path.resolve(__dirname,'..');
(async()=>{
  const b=await chromium.launch(); const res=[];
  for(const [name,w,h] of [['tel',360,740],['tablet',768,1024],['desk',1366,800]]){
    const ctx=await b.newContext({viewport:{width:w,height:h}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept());
    const over=async(tag)=>{ const o=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+1&&getComputedStyle(e).position!=='fixed').slice(0,4).map(e=>e.tagName+'#'+e.id+'.'+String(e.className).slice(0,20))})); if(o.sw>o.cw) res.push(`${name} ${tag}: horizontalni preljev ${o.sw}>${o.cw} ${o.wide}`); await p.screenshot({path:`/tmp/shots/${name}_${tag}.png`,fullPage:true}); };
    await p.goto('file://'+path.join(root,'app/index.html')); await over('login');
    await p.fill('#em','d@idss.ba'); await p.fill('#im','Direktor'); await p.click('#go'); await over('pocetna');
    await p.click('nav.tabs button[data-k="novi"]'); await over('novi');
    await p.selectOption('#n_sc','ZAJEDNICKI'); await p.fill('#n_tema','Planiranje nove školske godine i dugi naslov koji se mora prelomiti u više redova na uskom ekranu'); await p.fill('#n_mj','Kancelarija'); await p.fill('#n_pred','Tarik Mehić'); await p.fill('#n_zap','Selma Begović');
    await p.fill('#n_uc','Tarik Mehić — direktor\nSelma Begović — office manager\nAmra Delić — pedagog'); await p.fill('#n_dn','dani otvorenih vrata [zajedničko]\nzimski bazar [IMH]\ndežurstva [IDSS]');
    await p.selectOption('#n_tip',{index:1}); await p.click('#n_go'); await over('saglasnost');
    await p.check('#s_da'); await p.fill('#s_ko','Selma'); await p.click('#s_sn'); await p.waitForSelector('#r_start'); await over('snimanje');
    await p.fill('#r_tr','Test transkript.'); await p.click('#r_next'); await p.waitForTimeout(1500);
    if(await p.isVisible('#ob')) await over('obrada');
    await p.click('nav.tabs button[data-k="arhiva"]').catch(()=>{}); await over('arhiva');
    await p.click('nav.tabs button[data-k="postavke"]').catch(()=>{}); await over('postavke');
    await p.click('nav.tabs button[data-k="upute"]').catch(()=>{}); await over('upute');
    if(errs.length) res.push(name+' JS: '+errs.join('|'));
  }
  console.log(res.join('\n')||'nema preljeva ni grešaka'); await b.close();
})();
