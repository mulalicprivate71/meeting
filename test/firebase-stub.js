// Simulirani Firebase (compat) klijent za testove: čuva dokumente u memoriji i provodi ista pravila kao firestore.rules
// (prelazi statusa, rev, zaključavanje potvrđenog). Ovo NIJE test pravila, nego testira ponašanje aplikacije.
(function(){
  const docs = window.__docs = {}; const log = (window.__log = []); let tick = 0;
  const OK = [['saglasnost','snimanje'],['saglasnost','nacrt'],['snimanje','obrada'],['snimanje','nacrt'],['obrada','nacrt'],['nacrt','potvrdjen']];
  const TS = {__ts:1};
  const err = (code,msg)=>Object.assign(new Error(msg||code),{code});
  const resolve = v => JSON.parse(JSON.stringify(v, (k,x)=> x && x.__ts ? "T"+(++tick) : x));
  const cfg = window.__cfg = {role:{IMH:'direktor',IDSS:'direktor',ime:'Direktor Test'}, gemini:{keys:'k1,k2,k3'}};
  function checkWrite(path, oldD, newD){
    if(path[0]==='destroyed'){ if(oldD) throw err('permission-denied','destroyed immut'); return; }
    if(path[0]!=='meetings') throw err('permission-denied');
    if(path.length>2) return;
    if(!oldD){ if(newD.rev!==1) throw err('permission-denied','rev'); if(!['saglasnost','snimanje','obrada','nacrt'].includes(newD.status)) throw err('permission-denied','status'); return; }
    if(oldD.status==='potvrdjen') throw err('permission-denied','zakljucan');
    if(newD.rev!==oldD.rev+1) throw err('permission-denied','rev');
    if(newD.scope!==oldD.scope||newD.createdBy!==oldD.createdBy) throw err('permission-denied','immut');
    if(newD.status!==oldD.status && !OK.some(p=>p[0]===oldD.status&&p[1]===newD.status)) throw err('permission-denied','BAD '+oldD.status+'->'+newD.status);
    if(newD.status==='potvrdjen' && !(newD.confirmedBy && newD.confirmedAt)) throw err('permission-denied','potvrda');
  }
  const wrapTs = d => { if(d && typeof d.confirmedAt==='string' && /^20/.test(d.confirmedAt)){ const iso=d.confirmedAt; d.confirmedAt={toDate:()=>new Date(iso)}; } return d; };
  function colRef(path){ // path: array
    return {
      doc: id => docRef(path.concat(id)),
      add: async d => { log.push('add '+path.join('/')); docs[path.concat('x'+(++tick)).join('/')] = resolve(d); },
      where(f,op,v){ const q={path,filters:[[f,v]]}; const api={ where(f2,o2,v2){q.filters.push([f2,v2]);return api;}, async get(){ log.push('query '+q.filters.map(x=>x[0]+'='+x[1]).join('&'));
        const out=[]; Object.keys(docs).forEach(k=>{ const p=k.split('/'); if(p.length===path.length+1 && p.slice(0,-1).join('/')===path.join('/')){ const d=docs[k]; if(q.filters.every(([f,v])=>d[f]===v)) out.push({id:p[p.length-1],data:()=>wrapTs(JSON.parse(JSON.stringify(d)))}); } });
        return {forEach:cb=>out.forEach(cb), docs:out}; } }; return api; },
      async get(){ const out=[]; Object.keys(docs).forEach(k=>{ const p=k.split('/'); if(p.length===path.length+1 && p.slice(0,-1).join('/')===path.join('/')) out.push({id:p[p.length-1],data:()=>docs[k],ref:docRef(p)}); }); return {forEach:cb=>out.forEach(cb), docs:out}; }
    };
  }
  function docRef(path){
    const key = path.join('/');
    return { path, id:path[path.length-1], collection: n => colRef(path.concat(n)),
      async get(){ if(key.startsWith('memberships/')) return {exists:true,data:()=>cfg.role};
        if(key==='config/gemini') return cfg.gemini?{exists:true,data:()=>cfg.gemini}:{exists:false}; if(key.includes('/consents/main')){ const c=docs[key]; return {exists:!!c,data:()=>c}; } const d=docs[key]; return {exists:!!d,data:()=>d&&wrapTs(JSON.parse(JSON.stringify(d))),id:path[path.length-1]}; },
      async delete(){ const par = path[0]==='meetings' ? docs['meetings/'+path[1]] : null; if(!par || par.status!=='potvrdjen' || !/^20/.test(String(par.confirmedAt)) || Date.now()-new Date(par.confirmedAt).getTime() < 365*864e5) throw err('permission-denied','rok nije istekao'); log.push('delete '+key); delete docs[key]; },
      async set(d){ const nd=resolve(d); checkWrite(path, docs[key], nd); log.push((docs[key]?'set ':'create ')+(nd.status||'')+(docs[key]?'<-'+docs[key].status:'')); docs[key]=nd; } };
  }
  const db = { collection: n => colRef([n]),
    async runTransaction(fn){ const pend=[]; const tx={ get: async r=>r.get(), set:(r,d)=>pend.push([r,d]) };
      const res = await fn(tx); pend.forEach(([r,d])=>{ const nd=resolve(d); checkWrite(r.path, docs[r.path.join('/')], nd); log.push('tx '+nd.status+'<-'+docs[r.path.join('/')].status); docs[r.path.join('/')]=nd; }); return res; } };
  const fsFn = () => db; fsFn.FieldValue = {serverTimestamp:()=>TS};
  let user = null, listeners = [];
  const auth = { onAuthStateChanged(cb){ setTimeout(()=>cb(user),0); return ()=>{}; },
    async signInWithEmailAndPassword(e,p){ if(p!=='ok') throw err('auth/wrong-password'); user={email:e,uid:'u-1',displayName:null}; return {user}; },
    async signOut(){ user=null; } };
  window.firebase = {
    initializeApp: ()=>({}),
    auth: ()=>auth, firestore: fsFn
  };
})();
