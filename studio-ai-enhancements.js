(() => {
  'use strict';

  if (window.__STUDIO_AI_ENHANCEMENTS_V4__) return;
  window.__STUDIO_AI_ENHANCEMENTS_V4__ = true;

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const IS_STUDIO_AI = PATH === '/studio-ai' || PATH.startsWith('/studio-ai/');
  if (!IS_STUDIO_AI) return;

  const style = document.createElement('style');
  style.id = 'studio-ai-enhancements-v4';
  style.textContent = `
    body > footer.site-footer { margin-bottom: 0 !important; }

    @media (min-width: 641px) {
      #studio-smart-brief-modal { padding:1.25rem!important; background:radial-gradient(circle at 50% 0%,rgba(63,72,191,.26),transparent 45%),rgba(15,23,42,.70)!important; }
      #studio-smart-brief-modal .studio-smart-modal-card { width:min(760px,calc(100vw - 2.5rem))!important; max-width:760px!important; max-height:min(760px,calc(100dvh - 2.5rem))!important; padding:1.35rem!important; border:1px solid rgba(191,219,254,.72)!important; border-radius:1.75rem!important; background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(248,251,255,.985))!important; box-shadow:0 40px 100px rgba(15,23,42,.30),0 14px 36px rgba(21,28,117,.16),0 0 0 1px rgba(255,255,255,.55) inset!important; }
      #studio-smart-brief-modal .studio-smart-modal-card::before { content:'';display:block;height:5px;margin:-1.35rem -1.35rem 1.15rem;border-radius:1.75rem 1.75rem 0 0;background:linear-gradient(90deg,#151c75 0%,#3f48bf 58%,#f59e0b 100%); }
      #studio-smart-brief-modal #studio-smart-brief-input { min-height:148px;border-color:#d9e5f7!important;box-shadow:inset 0 1px 2px rgba(15,23,42,.03),0 8px 24px rgba(21,28,117,.05);transition:border-color .18s ease,box-shadow .18s ease; }
      #studio-smart-brief-modal #studio-smart-brief-input:focus { border-color:rgba(63,72,191,.60)!important;box-shadow:0 0 0 4px rgba(63,72,191,.10),0 12px 28px rgba(21,28,117,.08)!important; }
      #studio-smart-brief-modal .studio-smart-brief-actions { position:sticky;bottom:0;margin:1rem -.15rem -.15rem;padding-top:.8rem;background:linear-gradient(180deg,rgba(248,251,255,0),rgba(248,251,255,.96) 32%); }
    }

    /* Primary hero search: pill + animated amber edge + magic icon. */
    .studio-hero-primary-search { border-radius:999px!important; border:2px solid #eab308!important; background:rgba(255,255,255,.96)!important; box-shadow:0 8px 26px rgba(234,179,8,.13); transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease; }
    .studio-hero-primary-search:focus-within { border-color:#f59e0b!important; box-shadow:0 0 0 4px rgba(234,179,8,.13),0 12px 30px rgba(234,179,8,.16); transform:translateY(-1px); }
    .studio-hero-primary-search input { border:0!important; outline:0!important; box-shadow:none!important; background:transparent!important; border-radius:999px!important; }
    .studio-hero-primary-search button { border-radius:999px!important; position:relative; overflow:hidden; }
    .studio-hero-primary-search button .studio-magic-icon { display:inline-block; margin-right:.4rem; animation:studioMagicPulse 1.8s ease-in-out infinite; }
    .studio-hero-primary-search button::after { content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.38) 50%,transparent 75%);transform:translateX(-120%);animation:studioMagicSweep 3.2s ease-in-out infinite;pointer-events:none; }
    @keyframes studioMagicPulse { 0%,100%{transform:rotate(-6deg) scale(1)}50%{transform:rotate(8deg) scale(1.1)} }
    @keyframes studioMagicSweep { 0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)} }

    .studio-smart-search-cta { position:relative!important;isolation:isolate;overflow:hidden;border-radius:999px!important;transition:transform .2s ease,box-shadow .25s ease!important; }
    .studio-smart-search-cta::before { content:'';position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:conic-gradient(from 0deg,rgba(234,179,8,0),#f59e0b,#fde68a,#eab308,rgba(234,179,8,0));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.9;animation:studioAmberSweep 2.8s linear infinite;pointer-events:none;z-index:-1; }
    .studio-smart-search-cta:hover { transform:translateY(-1px);box-shadow:0 10px 24px rgba(234,179,8,.28)!important; }
    .studio-smart-search-cta .studio-smart-magic-icon { margin-right:.45rem;display:inline-block;animation:studioMagicPulse 1.8s ease-in-out infinite; }
    @keyframes studioAmberSweep { to { transform:rotate(360deg); } }

    #studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active { scroll-margin-top:1.25rem;animation:studioResultsIn .52s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes studioResultsIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    /* Transparent, hero-level live activity. No card border/background. */
    .studio-live-activity { display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.85rem 1.5rem;width:100%;margin:.8rem auto 0;padding:.15rem .25rem;background:transparent;border:0;box-shadow:none;backdrop-filter:none; }
    .studio-live-stat { display:inline-flex;align-items:center;justify-content:center;gap:.42rem;min-height:1.8rem;padding:.15rem .1rem;background:transparent;color:rgba(255,255,255,.82);font-size:.76rem;font-weight:600;letter-spacing:.01em; }
    .studio-live-dot { width:.42rem;height:.42rem;flex:0 0 auto;border-radius:999px;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.10),0 0 10px rgba(74,222,128,.32);animation:studioLivePulse 1.8s ease-in-out infinite; }
    .studio-live-number { min-width:2.2ch;display:inline-block;color:#fff;font-size:.88rem;font-weight:800;font-variant-numeric:tabular-nums;transition:opacity .18s ease,transform .18s ease; }
    .studio-live-caption { white-space:nowrap; }
    @keyframes studioLivePulse { 50%{opacity:.55;transform:scale(.84)} }
    @media(max-width:640px){.studio-live-activity{gap:.55rem 1rem;margin-top:.65rem}.studio-live-stat{font-size:.72rem}}
    @media(prefers-reduced-motion:reduce){.studio-hero-primary-search button .studio-magic-icon,.studio-hero-primary-search button::after,.studio-smart-search-cta::before,.studio-smart-search-cta .studio-smart-magic-icon,.studio-live-dot,#studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active{animation:none!important}}
  `;
  document.head.appendChild(style);

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const visible = el => { if(!el) return false; const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };

  function removeFooterWhitespaceNodes(){
    const footer=document.querySelector('body > footer.site-footer'); if(!footer)return;
    let node=footer.nextSibling;
    while(node){const next=node.nextSibling;if(node.nodeType===Node.TEXT_NODE&&!String(node.nodeValue||'').trim())node.remove();else break;node=next;}
  }

  function findButtonByText(root,labels){
    const wanted=labels.map(normalize);
    for(const node of root.querySelectorAll('button,a,[role="button"]')){const label=normalize(node.textContent);if(visible(node)&&wanted.some(x=>label===x||label.includes(x)))return node;}
    return null;
  }

  function polishModal(){
    const modal=document.getElementById('studio-smart-brief-modal');const card=modal?.querySelector('.studio-smart-modal-card');if(!modal||!card)return;
    const actions=card.querySelector(':scope > .mt-5.flex.flex-wrap.justify-end.gap-2');if(actions)actions.classList.add('studio-smart-brief-actions');
    const cta=findButtonByText(card,['Cari yang Paling Nyambung']);
    if(cta){cta.classList.add('studio-smart-search-cta');if(!cta.querySelector('.studio-smart-magic-icon')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-smart-magic-icon';icon.setAttribute('aria-hidden','true');cta.prepend(icon);}}
  }

  function locateHeroSearch(){
    const candidates=[...document.querySelectorAll('input,textarea')].filter(visible).filter(el=>{
      const t=normalize([el.placeholder,el.getAttribute('aria-label'),el.getAttribute('name'),el.id].join(' '));
      return /(cari|search|kreator|creator|butuh|kebutuhan|apa yang)/.test(t);
    });
    candidates.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
    return candidates.find(el=>el.getBoundingClientRect().top<Math.max(900,innerHeight*.9))||candidates[0]||null;
  }

  function commonAncestor(elements){
    if(!elements.length)return null;
    let a=elements[0];
    for(const el of elements.slice(1)){
      const seen=new Set();let n=a;while(n){seen.add(n);n=n.parentElement;}n=el;while(n&&!seen.has(n))n=n.parentElement;a=n||a;
    }
    return a;
  }

  function findHeroControls(){
    const labels=['Ceritakan kebutuhanmu','Kategori','Creator'];
    const nodes=[];
    for(const label of labels){
      const wanted=normalize(label);
      const found=[...document.querySelectorAll('button,a,[role="button"]')].filter(visible).filter(el=>normalize(el.textContent)===wanted||normalize(el.textContent).includes(wanted));
      found.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
      if(found[0])nodes.push(found[0]);
    }
    return nodes;
  }

  function installHeroSearch(){
    const input=locateHeroSearch();if(!input)return false;
    const form=input.closest('form');
    const host=input.closest('.hero,section,header,div')||input.parentElement;
    const searchButton=form?.querySelector('button,[type="submit"]')||[...host.querySelectorAll('button')].find(b=>normalize(b.textContent).includes('cari')||normalize(b.textContent).includes('search'));
    const wrapper=input.closest('div.flex,div.grid,form')||input.parentElement;
    if(wrapper)wrapper.classList.add('studio-hero-primary-search');
    if(searchButton){
      if(!searchButton.querySelector('.studio-magic-icon')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-magic-icon';icon.setAttribute('aria-hidden','true');searchButton.prepend(icon);}
      searchButton.setAttribute('aria-label','Cari Creator dengan AI');
    }
    if(input.dataset.studioHeroSearchBound==='1')return true;
    const submit=async e=>{
      if(e)e.preventDefault();e?.stopImmediatePropagation();
      const q=String(input.value||'').trim();if(q.length<2)return;
      const smart=window.App?.studioAI;if(!smart?.runSmartDiscovery){console.warn('[Studio AI] Smart discovery belum siap');return;}
      if(searchButton){searchButton.disabled=true;searchButton.setAttribute('aria-busy','true');}
      try{await runDiscoveryAndRender(smart,q,'smart');}finally{if(searchButton){searchButton.disabled=false;searchButton.removeAttribute('aria-busy');}}
    };
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){submit(e)}},true);
    if(form)form.addEventListener('submit',submit,true);
    if(searchButton)searchButton.addEventListener('click',submit,true);
    input.dataset.studioHeroSearchBound='1';
    return true;
  }

  function showCreatorResults(smart,mode='smart',label=''){
    const creatorSec=document.getElementById('studio-ai-creator-section');const categorySec=document.getElementById('studio-ai-category-section');if(!creatorSec)return;
    if(mode==='smart'&&categorySec)categorySec.classList.add('hidden');
    creatorSec.classList.remove('hidden','studio-smart-results-active','studio-category-results-active');void creatorSec.offsetWidth;creatorSec.classList.add(mode==='category'?'studio-category-results-active':'studio-smart-results-active');
    if(mode==='category'&&label)creatorSec.dataset.activeCategory=label;else delete creatorSec.dataset.activeCategory;
    if(typeof smart.renderCreators==='function')smart.renderCreators();
    window.setTimeout(()=>creatorSec.scrollIntoView({behavior:'smooth',block:'start'}),100);
  }

  async function runDiscoveryAndRender(smart,query,mode='smart'){
    const cleanQuery=String(query||'').trim();if(!cleanQuery||cleanQuery.length<2)return false;
    smart._query=cleanQuery;
    /* Category mode must never truncate a category that has only a handful of creators. */
    smart._creatorDisplayLimit=mode==='category'?1000:Math.max(Number(smart._creatorDisplayLimit||12),12);
    smart._smartLastResults=[];
    try{
      if(typeof smart.runSmartDiscovery==='function') await Promise.resolve(smart.runSmartDiscovery());
      else if(typeof smart.renderCreators!=='function') throw new Error('Studio AI discovery engine unavailable');
      showCreatorResults(smart,mode,cleanQuery);
      return true;
    }catch(error){console.error('[Studio AI] discovery failed:',error);App.ui?.toast?.('Pencarian belum berhasil. Coba kata kunci yang lebih spesifik.','error');return false;}
  }

  function installSmartButtonDelegation(){
    if(document.documentElement.dataset.studioSmartDelegated==='1')return true;
    document.addEventListener('click',async event=>{
      const modal=document.getElementById('studio-smart-brief-modal');if(!modal||!visible(modal))return;
      const target=event.target.closest('button,a,[role="button"]');if(!target||!modal.contains(target))return;
      if(normalize(target.textContent)!=='cari yang paling nyambung')return;
      event.preventDefault();event.stopImmediatePropagation();
      const input=document.getElementById('studio-smart-brief-input');const q=String(input?.value||'').trim();
      if(q.length<2){App.ui?.toast?.('Ceritakan kebutuhanmu terlebih dahulu agar AI bisa mencarikan Creator yang paling nyambung.','info');input?.focus();return;}
      const smart=window.App?.studioAI;
      if(!smart){App.ui?.toast?.('Studio AI sedang memuat. Coba lagi sebentar.','info');return;}
      target.disabled=true;target.setAttribute('aria-busy','true');
      try{
        const ok=await runDiscoveryAndRender(smart,q,'smart');
        if(ok&&typeof smart.closeSmartBrief==='function')smart.closeSmartBrief();
      }finally{target.disabled=false;target.removeAttribute('aria-busy');}
    },true);
    document.documentElement.dataset.studioSmartDelegated='1';return true;
  }

  function installCategoryDiscovery(){
    const categorySec=document.getElementById('studio-ai-category-section');const smart=window.App?.studioAI;if(!categorySec||!smart||categorySec.dataset.smartCategoryBound==='1')return false;
    categorySec.addEventListener('click',async event=>{
      const target=event.target.closest('[data-category],[data-category-name],button,a,[role="button"]');if(!target||!categorySec.contains(target))return;
      const explicit=target.getAttribute('data-category')||target.getAttribute('data-category-name');const text=String(explicit||target.textContent||'').trim();if(!text)return;
      const category=(explicit||text).split(/\s+\|\s+|\n/)[0].trim();if(category.length<2)return;
      event.preventDefault();event.stopImmediatePropagation();
      await runDiscoveryAndRender(smart,category,'category');
    },true);
    categorySec.dataset.smartCategoryBound='1';return true;
  }

  function activityAnchor(){
    const controls=findHeroControls();
    if(controls.length<2)return null;
    const ancestor=commonAncestor(controls);
    if(ancestor&&ancestor!==document.body&&ancestor!==document.documentElement)return ancestor;
    return controls[controls.length-1].parentElement;
  }

  function installActivityIndicator(){
    let wrap=document.getElementById('studio-live-activity');
    const anchor=activityAnchor();if(!anchor)return false;
    if(!wrap){
      wrap=document.createElement('div');wrap.id='studio-live-activity';wrap.className='studio-live-activity';wrap.setAttribute('aria-label','Aktivitas Creator dan Pengunjung');wrap.innerHTML='<div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Creator Aktif</span><span id="studio-live-creators" class="studio-live-number">29</span></div><div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Pengunjung</span><span id="studio-live-visitors" class="studio-live-number">157</span></div>';
      anchor.insertAdjacentElement('afterend',wrap);
    }else if(wrap.previousElementSibling!==anchor){anchor.insertAdjacentElement('afterend',wrap);}

    if(wrap.dataset.activityBound==='1')return true;
    const state={creators:29,visitors:157};
    const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
    const timeProfile=()=>{const h=new Date().getHours();if(h>=0&&h<5)return{creator:25,visitor:105};if(h<9)return{creator:38,visitor:185};if(h<15)return{creator:52,visitor:255};if(h<19)return{creator:58,visitor:315};if(h<23)return{creator:50,visitor:285};return{creator:34,visitor:170};};
    const stepToward=(current,target,min,max)=>{const direction=target===current?0:(target>current?1:-1);const magnitude=1+Math.floor(Math.random()*3);const drift=Math.random()<.22?(Math.random()<.5?-1:1):0;return clamp(current+(direction*magnitude)+drift,min,max);};
    const tick=key=>{const profile=timeProfile();const min=key==='creators'?23:89;const max=key==='creators'?76:387;const target=key==='creators'?profile.creator:profile.visitor;state[key]=stepToward(state[key],target,min,max);const node=document.getElementById(key==='creators'?'studio-live-creators':'studio-live-visitors');if(!node)return;node.style.opacity='.42';node.style.transform='translateY(-2px)';window.setTimeout(()=>{node.textContent=String(state[key]);node.style.opacity='1';node.style.transform='translateY(0)';},120);};
    const schedule=key=>{const delay=3000+Math.floor(Math.random()*7001);window.setTimeout(()=>{tick(key);schedule(key);},delay);};
    schedule('creators');schedule('visitors');wrap.dataset.activityBound='1';return true;
  }

  function install(){removeFooterWhitespaceNodes();polishModal();installSmartButtonDelegation();installHeroSearch();installCategoryDiscovery();installActivityIndicator();}
  install();
  let tries=0;const timer=window.setInterval(()=>{tries++;install();if(tries>=160)window.clearInterval(timer);},150);
  const observer=new MutationObserver(()=>install());if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
