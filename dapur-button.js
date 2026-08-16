(()=>{
  'use strict';

  /**
   * Canonical Kamar -> Dapur CTA.
   * /dapur is the private Creator workspace for every eligible Premium member.
   * Public Creator URLs use /{username}; Kamar never builds a workspace URL.
   * Supabase RPC/RLS remains the security boundary.
   */

  const SELECTOR='#kamar-creator-entry';
  const BUTTON_SELECTOR=`${SELECTOR} button`;
  const LEGACY_LABELS=new Set(['Mulai di Dapur','Buka Dapur','Buat Dapur Gratis','Mulai Membuat Dapur','Kelola Dapur Kamu','Kelola Dapurku']);
  const CHECK_DELAY=150;
  let timer=0,inFlight=false,observer=null,authSubscription=null;
  const db=()=>window.supabaseClient||null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function findButton(){return document.querySelector(BUTTON_SELECTOR)}
  function normalize(){const b=findButton();if(!b)return;const label=String(b.textContent||'').trim();if(LEGACY_LABELS.has(label)){b.textContent='Memuat Dapur...';b.disabled=true;b.setAttribute('aria-busy','true')}}

  async function resolve(){
    const c=db();
    if(!c?.auth)return null;
    const {data,error}=await c.auth.getUser();
    if(error)throw error;
    if(!data?.user?.id)return {label:'Masuk / Daftar',path:'/kamar?next=%2Fdapur&intent=creator'};
    const {data:access,error:accessError}=await c.rpc('has_creator_workspace_access');
    if(accessError)throw accessError;
    return access===true
      ? {label:'Kelola Dapur',path:'/dapur'}
      : {label:'Lihat Produk Premium',path:'/'};
  }

  function apply(state){
    const b=findButton();if(!b||!state)return;
    b.removeAttribute('onclick');
    b.type='button';
    b.textContent=state.label;
    b.disabled=false;
    b.removeAttribute('aria-busy');
    b.removeAttribute('aria-disabled');
    b.dataset.dapurCtaManaged='1';
    b.dataset.dapurTarget=state.path;
    if(b.dataset.dapurListenerBound==='1')return;
    b.addEventListener('click',e=>{e.preventDefault();const target=b.dataset.dapurTarget||'/dapur';if(target==='/dapur'||target==='/'||target.startsWith('/kamar?'))window.location.assign(target)},{passive:false});
    b.dataset.dapurListenerBound='1';
  }

  async function sync(){
    const b=findButton();if(!b||inFlight)return;
    inFlight=true;
    try{normalize();apply(await resolve())}
    catch(e){console.warn('[Studihome Kamar -> Dapur]',e?.message||e);const current=findButton();if(current){current.textContent='Kelola Dapur';current.disabled=false;current.removeAttribute('aria-busy');current.dataset.dapurTarget='/dapur'}}
    finally{inFlight=false}
  }

  function schedule(){clearTimeout(timer);timer=window.setTimeout(()=>void sync(),CHECK_DELAY)}

  async function boot(){
    for(let i=0;i<120;i++){if(db()?.auth)break;await sleep(50)}
    if(!db()?.auth)return;
    schedule();
    if(!observer&&document.body){observer=new MutationObserver(()=>{if(document.querySelector(SELECTOR))schedule()});observer.observe(document.body,{childList:true,subtree:true})}
    if(!authSubscription){const {data}=db().auth.onAuthStateChange(()=>schedule());authSubscription=data?.subscription||null}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});else void boot();
})();
