(()=>{
'use strict';
if(window.__DAPUR_PRODUCTION_HARDENING_V2__)return;
window.__DAPUR_PRODUCTION_HARDENING_V2__=true;
const client=()=>window.supabaseClient;
const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
const slug=()=>{const m=path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);return m?m[1].toLowerCase():''};
let ownerPromise=null;
async function owner(){
  if(ownerPromise)return ownerPromise;
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
  const c=client(); if(!c||c.__dapurProductionPatched)return false;
  const originalFrom=c.from.bind(c), originalRpc=c.rpc.bind(c);
  c.from=function(table){
    const builder=originalFrom(table),kind=mutationTables[table];
    if(!kind)return builder;
    const addOwner=b=>owner().then(o=>kind==='profile'?b.eq('id',o.id).eq('user_id',o.uid):b.eq(kind,o.id));
    return new Proxy(builder,{get(target,prop,receiver){
      if(prop==='update')return values=>addOwner(target.update({...values}));
      if(prop==='delete')return (...args)=>addOwner(target.delete(...args));
      if(prop==='upsert')return (values,...args)=>owner().then(o=>{const arr=Array.isArray(values)?values:[values];return target.upsert(arr.map(v=>kind==='profile'?{...v,user_id:o.uid}:{...v,creator_id:o.id}),...args)});
      if(prop==='insert')return (values,...args)=>owner().then(o=>{const arr=Array.isArray(values)?values:[values];const next=arr.map(v=>kind==='profile'?{...v,user_id:o.uid}:{...v,creator_id:o.id});return target.insert(Array.isArray(values)?next:next[0],...args)});
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
  window.DapurProductionHardening={owner,originalFrom,originalRpc};
  return true;
}
function start(){if(!patchClient())setTimeout(start,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();