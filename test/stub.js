(function(){
 const rows={}, log=[]; let tick=0; window.__log=log;
 const OK=[['saglasnost','snimanje'],['saglasnost','nacrt'],['snimanje','obrada'],['snimanje','nacrt'],['obrada','nacrt'],['nacrt','potvrdjen']];
 const ts=()=>new Date(Date.UTC(2026,10,15,0,0,0,++tick*1000)).toISOString();
 function q(table){ const st={table,f:{}}; 
  const api={ select(){ st.sel=1; return api;}, order(){return api;}, eq(k,v){st.f[k]=v;return api;}, single(){st.single=1;return api;},
   insert(r){st.op='ins';st.r=r;return api;}, update(r){st.op='upd';st.r=r;return api;},
   then(res,rej){ return Promise.resolve(run()).then(res,rej); } };
  function run(){
   if(table==='meetings'){
    if(st.op==='ins'){ rows[st.r.id]={...st.r,updated_at:ts(),created_at:ts()}; log.push('ins '+st.r.status); return {data:{updated_at:rows[st.r.id].updated_at},error:null}; }
    if(st.op==='upd'){ const o=rows[st.f.id]; if(!o||o.updated_at!==st.f.updated_at) {log.push('upd-conflict');return {data:[],error:null};}
      if(o.status==='potvrdjen') {log.push('upd-locked');return {data:null,error:{message:'Potvrđeni zapisnik je zaključan.'}};}
      if(o.status!==st.r.status && !OK.some(p=>p[0]===o.status&&p[1]===st.r.status)) {log.push('BAD '+o.status+'->'+st.r.status);return {data:null,error:{message:'Nedozvoljen prelaz'}};}
      log.push('upd '+o.status+'->'+st.r.status); Object.assign(o,st.r,{updated_at:ts()}); return {data:[{updated_at:o.updated_at}],error:null}; }
    return {data:Object.values(rows).map(r=>({...r})),error:null};
   }
   if(table==='consents'){ log.push('consent'); return {error:null}; }
   return {data:[],error:null};
  }
  return api; }
 window.supabase={createClient(){ return {
  auth:{getSession:async()=>({data:{session:{user:{email:'u@x.ba',id:'11111111-1111-4111-8111-111111111111'}}}}),signOut:async()=>{},signInWithPassword:async()=>({})},
  from:q,
  storage:{from:()=>({upload:async(p)=>{log.push('upload '+p.split('/')[1]);return {error:null};}})},
  functions:{invoke:async(n,o)=>{log.push('fn '+(o.body.action||'process'));return o.body.action==='purge'?{data:{ok:true},error:null}:{data:{minutes:{tacke:[{rasprava:'x'}],zadaci:[{zadatak:'',odgovorna:'',rok:'',status:'Otvoren',oznaka:'IDSS'}],naredni:''}},error:null};}}
 };}};
})();
