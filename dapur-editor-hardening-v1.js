(()=>{
  'use strict';
  if(window.__DAPUR_EDITOR_HARDENING_V1__)return;
  window.__DAPUR_EDITOR_HARDENING_V1__=true;
  const db=()=>window.supabaseClient;
  const routeSlug=()=>{const m=(location.pathname||'').replace(/\/+$/,'').match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);return m?m[1].toLowerCase():''};
  let resolved=null;
  async function resolveCreator(){
    const slug=routeSlug();
    if(!slug)throw new Error('Editor Dapur hanya tersedia pada /dapur/:username.');
    const client=db();
    if(!client)throw new Error('Koneksi Supabase belum siap. Muat ulang halaman lalu coba lagi.');
    const auth=await client.auth.getUser();
    if(auth.error)throw auth.error;
    const uid=auth.data?.user?.id;
    if(!uid)throw new Error('Sesi login belum siap. Silakan masuk kembali.');
    if(resolved?.uid===uid&&resolved?.slug===slug)return resolved.id;
    const q=await client.from('creator_profiles').select('id,user_id,username').eq('user_id',uid).eq('username',slug).maybeSingle();
    if(q.error)throw q.error;
    if(!q.data)throw new Error('Profil Creator pada URL ini tidak cocok dengan akun yang sedang masuk.');
    resolved={uid,slug,id:q.data.id};
    return q.data.id;
  }
  function install(){
    const api=window.AdminDapurUI;
    if(!api||api.__hardeningWrapped)return false;
    const original={profile:api.profile,categories:api.categories,service:api.service,portfolio:api.portfolio};
    if(typeof original.profile==='function')api.profile=async(...args)=>original.profile(await resolveCreator(),...args.slice(1));
    if(typeof original.categories==='function')api.categories=async(...args)=>original.categories(await resolveCreator(),...args);
    if(typeof original.service==='function')api.service=async(...args)=>original.service(await resolveCreator(),...args.slice(1));
    if(typeof original.portfolio==='function')api.portfolio=async(...args)=>original.portfolio(await resolveCreator(),...args.slice(1));
    api.__hardeningWrapped=true;
    window.DapurEditorHardening={resolveCreator,original};
    return true;
  }
  const start=()=>{if(!install())window.setTimeout(start,25)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
