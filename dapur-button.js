(()=>{
  'use strict';

  /** Canonical Kamar -> Dapur CTA. */
  const SELECTOR='#kamar-creator-entry';
  const BUTTON_SELECTOR=`${SELECTOR} button`;
  const LEGACY_LABELS=new Set(['Mulai di Dapur','Buka Dapur','Buat Dapur Gratis','Kelola Dapur','Kelola Dapurku','Kelola Dapur Kamu','Mulai Membuat Dapur']);
  const CHECK_DELAY=150;
  const SLUG_RE=/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/i;
  let timer=0,inFlight=false,observer=null,authSubscription=null;
  const db=()=>window.supabaseClient||null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function findButton(){return document.querySelector(BUTTON_SELECTOR)}
  function normalize(){const b=findButton();if(!b)return;const label=String(b.textContent||'').trim();if(LEGACY_LABELS.has(label)){b.textContent='Memuat Dapur...';b.disabled=true;b.setAttribute('aria-busy','true')}}
  function safeWorkspace(username){const slug=String(username||'').trim().toLowerCase();return SLUG_RE.test(slug)?`/dapur/${encodeURIComponent(slug)}`:null}
  async function resolve(){
    const c=db();if(!c?.auth)return null;
    const {data,error}=await c.auth.getUser();if(error)throw error;
    const currentUser=data?.user;if(!currentUser?.id)return{label:'Masuk / Daftar',path:'/kamar?next=%2Fdapur&intent=creator'};
    const {data:access,error:accessError}=await c.rpc('has_creator_workspace_access');if(accessError)throw accessError;
    if(access!==true)return{label:'Lihat Produk Premium',path:'/'};
    const {data:creator,error:creatorError}=await c.from('creator_profiles').select('username').eq('user_id',currentUser.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(creatorError)throw creatorError;
    const workspace=safeWorkspace(creator?.username);
    return workspace?{label:'Kelola Dapur Kamu',path:workspace}:{label:'Mulai Membuat Dapur',path:'/dapur',provision:true};
  }
  function apply(state){
    const b=findButton();if(!b||!state)return;
    b.removeAttribute('onclick');b.type='button';b.textContent=state.label;b.disabled=false;b.removeAttribute('aria-busy');b.removeAttribute('aria-disabled');b.dataset.dapurCtaManaged='1';b.dataset.dapurTarget=state.path;
    if(state.provision)b.dataset.dapurProvision='1';else delete b.dataset.dapurProvision;
    if(b.dataset.dapurListenerBound==='1')return;
    b.addEventListener('click',e=>{e.preventDefault();const target=b.dataset.dapurTarget||'/dapur';if(target==='/dapur'&&b.dataset.dapurProvision==='1'){try{sessionStorage.setItem('studihome_creator_provision','1')}catch{}}if(target==='/dapur'||target==='/'||target.startsWith('/kamar?')||safeWorkspace(target.replace(/^\/dapur\//,'')))window.location.assign(target)},{passive:false});
    b.dataset.dapurListenerBound='1';
  }
  async function sync(){
    const b=findButton();if(!b||inFlight)return;inFlight=true;
    try{normalize();apply(await resolve())}catch(e){console.warn('[Studihome Kamar -> Dapur]',e?.message||e);const current=findButton();if(current){current.textContent='Coba Lagi';current.disabled=false;current.removeAttribute('aria-busy');current.dataset.dapurTarget='/kamar'}}finally{inFlight=false}
  }
  function schedule(){clearTimeout(timer);timer=window.setTimeout(()=>void sync(),CHECK_DELAY)}
  async function boot(){for(let i=0;i<120;i++){if(db()?.auth)break;await sleep(50)}if(!db()?.auth)return;schedule();if(!observer&&document.body){observer=new MutationObserver(()=>{if(document.querySelector(SELECTOR))schedule()});observer.observe(document.body,{childList:true,subtree:true})}if(!authSubscription){const {data}=db().auth.onAuthStateChange(()=>schedule());authSubscription=data?.subscription||null}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});else void boot();
})();
