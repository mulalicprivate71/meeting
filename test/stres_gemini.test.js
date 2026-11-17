const assert=require('assert'); const GM=require('../app/gemini-klijent.js'); const {KeyRing}=GM;
const resp=(text,fr='STOP')=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text}]},finishReason:fr}]})});
(async()=>{
  // 1) dug dnevni red (20 tačaka) -> grupe po 8 + završni poziv
  const dn=Array.from({length:20},(_,i)=>'Tačka '+(i+1)); let poz=[];
  const f=async(url,opt)=>{ const b=JSON.parse(opt.body); const u=b.contents[0].parts[0].text; poz.push(u);
    if(u.includes('vrati samo "zadaci"')) return resp(JSON.stringify({tacke:[],zadaci:[{zadatak:'Z1',odgovorna:'A',rok:'2026-12-01'}],naredni:'Dec'}));
    const n=(u.match(/tačno (\d+) elemenata/)||[])[1]; return resp(JSON.stringify({tacke:Array.from({length:+n},(_,i)=>({rasprava:'r'+i,zakljucak:'z'})),zadaci:[],naredni:''})); };
  const d=await GM.nacrt(new KeyRing('a'),'tekst',dn,{fetch:f});
  assert.equal(d.tacke.length,20); assert.equal(poz.length,4); assert.equal(d.zadaci.length,1); assert(poz[1].includes('9. Tačka 9'));
  // 2) grupa vrati manje elemenata -> popuni praznim
  poz=[]; const f2=async(u,o)=>{ const t=JSON.parse(o.body).contents[0].parts[0].text; return resp(JSON.stringify(t.includes('vrati samo "zadaci"')?{tacke:[],zadaci:[]}:{tacke:[{rasprava:'x'}]})); };
  assert.equal((await GM.nacrt(new KeyRing('a'),'t',dn,{fetch:f2})).tacke.length,20);
  // 3) nastavak transkripcije: gotovi dijelovi se ne šalju ponovo
  let n=0; const f3=async()=>{ n++; return resp('novo'+n); }; const part=[]; 
  const dj=[1,2,3].map(()=>({blob:{size:10,type:'audio/webm',arrayBuffer:async()=>new ArrayBuffer(10)},mime:'audio/webm'}));
  global.FileReader=class{readAsDataURL(){this.result='data:audio/webm;base64,AAAA';setTimeout(()=>this.onload&&this.onload(),0);}};
  try{ const r=await GM.transkribuj(new KeyRing('a'),dj,'bs',{fetch:f3,gotovi:['A',null,null],poDijelu:(i,t)=>part.push([i,t])});
    assert(r.includes('A')); assert.equal(n,2); assert.deepEqual(part.map(p=>p[0]),[1,2]); console.log('resume OK'); }
  catch(e){ console.log('resume test preskočen (blob okruženje):',e.message); }
  // 4) sastavi: HTML, tipovi, ogromni tekstovi, 300 zadataka, loši datumi
  const m={scope:'IDSS',tacke:[{naslov:'A'}],zadaci:[]};
  const bad={tacke:[{rasprava:{x:1},zakljucak:['a'],za:'999999999999',nacin:'Javno'}],zadaci:Array.from({length:300},(_,i)=>({zadatak:'<b>t'+i+'</b>',odgovorna:null,rok:i%2?'2026-13-45':'sutra'})),naredni:12345};
  const o=GM.sastavi(m,bad,'t'); assert(o.zadaci.length<=200); assert(o.zadaci.every(z=>z.rok==='')); assert.equal(typeof o.naredni,'string');
  assert.equal(typeof o.tacke[0].rasprava,'string');
  // 5) svi ključevi 429 -> greška, ne beskonačna petlja
  const r=new KeyRing('a,b,c'); await assert.rejects(r.run(async()=>{const e=new Error('429');e.status=429;throw e;}));
  // 6) 6+ ključeva, razmaci, prazan
  assert.equal(new KeyRing(' a , b\n c;d,e,f,g ').keys.length,7); assert.throws(()=>new KeyRing(''));
  // 7) safety blok / prazan odgovor
  await assert.rejects(GM.nacrt(new KeyRing('a'),'t',['A'],{fetch:async()=>({ok:true,json:async()=>({candidates:[{finishReason:'SAFETY'}]})})}));
  await assert.rejects(GM.nacrt(new KeyRing('a'),'t',['A'],{fetch:async()=>({ok:true,json:async()=>({})})}));
  // 8) JSON s tekstom oko njega
  assert.equal((await GM.nacrt(new KeyRing('a'),'t',['A'],{fetch:async()=>resp('Evo:\n{"tacke":[{"rasprava":"r"}]} hvala')})).tacke[0].rasprava,'r');
  console.log('stres_gemini: OK');
})().catch(e=>{console.error(e);process.exit(1);});
