(()=>{
'use strict';
if(window.__DAPUR_INTERACTION_RECOVERY_V1__)return;
window.__DAPUR_INTERACTION_RECOVERY_V1__=true;
const path=()=>((location.pathname||'').replace(/\/+$/,'')||'/');
const isWorkspace=()=>/^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
const client=()=>window.supabaseClient;
async function ownerId(){
  const db=client();
  if(!db)throw Error('Koneksi Supabase belum siap.');
  const u=await db.auth.getUser();
  if(u.error)throw u.error;
  const uid=u.data?.user?.id;
  if(!uid)throw Error('Sesi login belum siap. Silakan masuk kembali.');
  const slug=(path().match(/^\/dapur\/([^/]+)$/i)||[])[1]?.toLowerCase();
  if(!slug)throw Error('Profil Dapur tidak valid.');
  const r=await db.from('creator_profiles').select('id,user_id,username').eq('user_id',uid).eq('username',slug).maybeSingle();
  if(r.error)throw r.error;
  if(!r.data)throw Error('Dapur ini bukan milik akun yang sedang masuk.');
  return r.data.id;
}
function notify(message,type='error'){if(window.App?.ui?.toast)window.App.ui.toast(message,type);else console[type==='error'?'error':'log'](message)}
async function dispatch(name){
  try{
    const id=await ownerId();
    if(name==='profile'&&typeof window.DapurProfileEditFix?.open==='function')return await window.DapurProfileEditFix.open();
    const api=window.AdminDapurUI;
    const fn=api?.[name];
    if(typeof fn!=='function')throw Error('Editor Dapur belum siap.');
    return await fn(id);
  }catch(e){notify(e?.message||'Editor belum dapat dibuka.');}
}
function install(){
  if(!isWorkspace())return;
  document.addEventListener('click',e=>{
    const step=e.target?.closest?.('[data-step]');
    const profile=e.target?.closest?.('[data-action="profile"]');
    if(!step&&!profile)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const name=profile?'profile':['profile','categories','service','portfolio'][Number(step.dataset.step)];
    if(name)void dispatch(name);
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.DapurInteractionRecovery={ownerId,dispatch};
})();