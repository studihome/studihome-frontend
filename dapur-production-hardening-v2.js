(function(){
'use strict';
if(window.__DAPUR_PRODUCTION_HARDENING_V2__)return;
window.__DAPUR_PRODUCTION_HARDENING_V2__=true;
const client=()=>window.supabaseClient;
const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
const slug=()=>{const m=path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);return m?m[1].toLowerCase():''};
let ownerPromise=null;
async function owner(){
  if(ownerPromise) return ownerPromise;
  ownerPromise=(async()=>{
    const c=client(); if(!c)throw new Error('Koneksi Dapur belum siap.');
    const a=await c.auth.getUser(); if(a.error)throw a.error;
    const uid=a.data?.user?.id; if(!uid)throw new Error('Sesi login belum siap.');
    const s=slug(); if(!s)throw new Error('Rute Dapur tidak valid.');
    const q=await c.from('creator_profiles').select('id,user_id,username').eq('user_id',uid).eq('username',s).maybeSingle();
    if(q.error)throw q.error;
    if(!q.data)throw new Error('Profil pada URL ini bukan milik akun yang sedang masuk.');
    return {uid,id:q.data.id,slug:s};
  })();
  try{return await ownerPromise}catch(e){ownerPromise=null;throw e}
}
const mutationTables={creator_profiles:'profile',creator_services:'creator_id',creator_portfolios:'creator_id',creator_category_members:'creator_id'};

async function patchClient(){
  const c=client(); if(!c||c.__dapurProductionPatched) return false;
  const originalFrom=c.from.bind(c), originalRpc=c.rpc.bind(c);

  // Cache admin check so we don't call RPC repeatedly in the same session.
  let adminPromise = null;
  async function isAdmin(){
    if(adminPromise!==null) return adminPromise;
    adminPromise = (async()=>{
      try{
        const r = await originalRpc('is_admin');
        if(r && r.error) return false;
        const val = r && typeof r.data!=='undefined' ? r.data : false;
        if(Array.isArray(val) && val.length>0){
          const first = val[0];
          if(typeof first==='object') return Boolean(Object.values(first).find(v=>v===true));
        }
        return Boolean(val);
      }catch(e){
        return false;
      }
    })();
    return adminPromise;
  }

  function makeExecWrapper({target,op,args,kind}){
    const filters = [];
    const passthrough = new Proxy({}, {
      get(_, prop){
        if(prop==='then'){
          return async (resolve,reject)=>{
            try{
              const admin = await isAdmin();
              let builder = target[op](...args);
              if(!admin && op==='delete'){
                const o = await owner();
                const hasCreatorFilter = filters.some(f=>f[0]==='eq' && f[1]==='creator_id');
                if(kind!=='profile' && !hasCreatorFilter){
                  builder = builder.eq(kind, o.id);
                }
              }
              for(const f of filters){
                const [name, ...rest] = f;
                if(typeof builder[name]==='function') builder = builder[name](...rest);
              }
              const result = await builder;
              return resolve(result);
            }catch(err){
              return reject(err);
            }
          };
        }
        return (...a)=>{ filters.push([prop, ...a]); return passthrough };
      }
    });
    return passthrough;
  }

  c.from=function(table){
    const builder=originalFrom(table), kind=mutationTables[table];
    if(!kind) return builder;

    return new Proxy(builder,{get(target,prop,receiver){
      if(prop==='update')return (...values)=>{
        return makeExecWrapper({target,op:'update',args:values,kind});
      };
      if(prop==='delete')return (...args)=>{
        return makeExecWrapper({target,op:'delete',args,kind});
      };
      if(prop==='upsert')return (values,...args)=>owner().then(o=>{
        const arr=Array.isArray(values)?values:[values];
        const mapped = arr.map(v=> kind==='profile' ? {...v, user_id: o.uid} : {...v, creator_id: o.id});
        return target.upsert(mapped,...args);
      });
      if(prop==='insert')return (values,...args)=>owner().then(o=>{
        const arr=Array.isArray(values)?values:[values];
        const mapped = arr.map(v=> kind==='profile' ? {...v, user_id: o.uid} : {...v, creator_id: o.id});
        return target.insert(Array.isArray(values)?mapped:mapped[0],...args);
      });
      return Reflect.get(target,prop,receiver);
    }});
  };

  c.rpc=async function(fn,args={}){
    if(fn==='change_creator_username_once'){
      const o=await owner(),username=String(args?.p_username||'').trim().toLowerCase();
      if(!username)throw new Error('Username wajib diisi.');
      return originalRpc('change_creator_username_for_profile',{p_creator_id:o.id,p_username:username});
    }
    return originalRpc(fn,args);
  };

  c.__dapurProductionPatched=true;
  window.DapurProductionHardening={owner,originalFrom,originalRpc,isAdmin};
  return true;
}
function start(){if(!patchClient())setTimeout(start,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
