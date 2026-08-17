(()=>{
  'use strict';

  // Kamar-only compatibility bridge. Canonical Dapur runtime lives in /dapur.html + /dapur-entry.js.
  const SELECTOR='#kamar-creator-entry';
  const BUTTON_SELECTOR=`${SELECTOR} button`;
  const LEGACY_LABELS=new Set([
    'Mulai di Dapur','Buka Dapur','Buat Dapur Gratis','Kelola Dapur',
    'Kelola Dapurku','Kelola Dapur Kamu','Kelola Dapur Creator',
    'Mulai Membuat Dapur'
  ]);
  const CREATOR_LABEL='Kelola Dapur Kamu';
  const CREATE_LABEL='Mulai Membuat Dapur';
  const PREMIUM_LABEL='Lihat Produk Premium';
  const LOGIN_LABEL='Masuk / Daftar';
  const SLUG_RE=/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/i;

  let bodyObserver=null;
  let hostObserver=null;
  let authSubscription=null;
  let timer=0;
  let inFlight=false;
  let cachedState=null;
  const db=()=>window.supabaseClient||null;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function host(){return document.querySelector(SELECTOR)}
  function findButton(){return document.querySelector(BUTTON_SELECTOR)}
  function safeWorkspace(username){
    const slug=String(username||'').trim().toLowerCase();
    return SLUG_RE.test(slug)?`/dapur/${encodeURIComponent(slug)}`:null;
  }
  function keyFor(userId,username,access){return `${userId||'public'}|${access?'1':'0'}|${username||''}`}

  function setPending(){
    const h=host();
    if(!h)return;
    h.style.visibility='hidden';
    const b=findButton();
    if(!b)return;
    b.removeAttribute('onclick');
    b.disabled=true;
    b.setAttribute('aria-busy','true');
  }

  function apply(state){
    const h=host();
    const b=findButton();
    if(!h||!b||!state)return;

    h.style.visibility='hidden';
    b.removeAttribute('onclick');
    b.type='button';
    b.textContent=state.label;
    b.disabled=false;
    b.removeAttribute('aria-busy');
    b.removeAttribute('aria-disabled');
    b.dataset.dapurCtaManaged='1';
    b.dataset.dapurTarget=state.path;

    if(b.dataset.dapurListenerBound!=='1'){
      b.addEventListener('click',e=>{
        e.preventDefault();
        const target=b.dataset.dapurTarget||'/dapur';
        if(target==='/dapur'||target==='/'||target.startsWith('/kamar?')||safeWorkspace(target.replace(/^\/dapur\//,''))){
          window.location.assign(target);
        }
      },{passive:false});
      b.dataset.dapurListenerBound='1';
    }

    h.classList.remove('hidden');
    h.style.visibility='visible';
  }

  async function resolve(){
    const c=db();
    if(!c?.auth)return null;
    const {data,error}=await c.auth.getUser();
    if(error)throw error;
    const currentUser=data?.user;
    if(!currentUser?.id){
      return {label:LOGIN_LABEL,path:'/dapur'};
    }

    const {data:access,error:accessError}=await c.rpc('has_creator_workspace_access');
    if(accessError)throw accessError;
    if(access!==true)return{label:PREMIUM_LABEL,path:'/'};

    const {data:creator,error:creatorError}=await c.from('creator_profiles')
      .select('username,managed_by_studihome')
      .eq('user_id',currentUser.id)
      .eq('managed_by_studihome',false)
      .order('updated_at',{ascending:false})
      .limit(1)
      .maybeSingle();
    if(creatorError)throw creatorError;

    const workspace=safeWorkspace(creator?.username);
    const state=workspace
      ? {label:CREATOR_LABEL,path:workspace}
      : {label:CREATE_LABEL,path:'/dapur'};
    state.cacheKey=keyFor(currentUser.id,creator?.username||'',true);
    return state;
  }

  async function sync(force=false){
    const b=findButton();
    if(!b||inFlight)return;

    if(!force&&cachedState){
      apply(cachedState);
      return;
    }

    inFlight=true;
    setPending();
    try{
      const state=await resolve();
      if(!state)return;
      cachedState=state;
      apply(state);
    }catch(e){
      console.warn('[Studihome Kamar -> Dapur]',e?.message||e);
      const h=host();
      const current=findButton();
      if(current){
        current.textContent='Coba Lagi';
        current.disabled=false;
        current.removeAttribute('aria-busy');
        current.dataset.dapurTarget='/kamar';
      }
      if(h){h.classList.remove('hidden');h.style.visibility='visible'}
    }finally{inFlight=false}
  }

  function schedule(force=false){
    clearTimeout(timer);
    timer=window.setTimeout(()=>void sync(force),0);
  }

  function observeHost(){
    const h=host();
    if(!h||hostObserver)return;
    setPending();
    hostObserver=new MutationObserver(()=>{
      if(inFlight)return;
      schedule(false);
    });
    hostObserver.observe(h,{childList:true,subtree:true});
  }

  function observeBodyUntilHost(){
    if(bodyObserver||host())return;
    bodyObserver=new MutationObserver(()=>{
      const h=host();
      if(!h)return;
      bodyObserver.disconnect();
      bodyObserver=null;
      observeHost();
      schedule(true);
    });
    bodyObserver.observe(document.body,{childList:true,subtree:true});
  }

  function loadUnderConstruction(){
    if(document.getElementById('studihome-under-construction-js'))return;
    const s=document.createElement('script');
    s.id='studihome-under-construction-js';
    s.src='/under-construction.js?v=1';
    s.defer=true;
    s.onerror=()=>console.warn('[Studihome Under Construction] module failed to load');
    document.head.appendChild(s);
  }

  function loadUnderConstructionGudang(){
    if(document.getElementById('studihome-under-construction-gudang-js'))return;
    const s=document.createElement('script');
    s.id='studihome-under-construction-gudang-js';
    s.src='/under-construction-gudang.js?v=1';
    s.defer=true;
    s.onerror=()=>console.warn('[Studihome Under Construction] Gudang integration failed to load');
    document.head.appendChild(s);
  }

  async function boot(){
    loadUnderConstruction();
    loadUnderConstructionGudang();
    for(let i=0;i<120;i++){
      if(db()?.auth)break;
      await sleep(50);
    }
    if(!db()?.auth)return;

    observeHost();
    observeBodyUntilHost();
    schedule(true);

    if(!authSubscription){
      const {data}=db().auth.onAuthStateChange(()=>{
        cachedState=null;
        setPending();
        schedule(true);
      });
      authSubscription=data?.subscription||null;
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void boot(),{once:true});
  else void boot();
})();
