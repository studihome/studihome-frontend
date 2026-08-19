(() => {
  'use strict';

  if (window.__STUDIO_AI_ENHANCEMENTS_V5__) return;
  window.__STUDIO_AI_ENHANCEMENTS_V5__ = true;

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (!(PATH === '/studio-ai' || PATH.startsWith('/studio-ai/'))) return;

  const style = document.createElement('style');
  style.id = 'studio-ai-enhancements-v5';
  style.textContent = `
    body > footer.site-footer { margin-bottom: 0 !important; }

    @media (min-width: 641px) {
      #studio-smart-brief-modal { padding:1.25rem!important; background:radial-gradient(circle at 50% 0%,rgba(63,72,191,.26),transparent 45%),rgba(15,23,42,.70)!important; }
      #studio-smart-brief-modal .studio-smart-modal-card { width:min(760px,calc(100vw - 2.5rem))!important; max-width:760px!important; max-height:min(760px,calc(100dvh - 2.5rem))!important; padding:1.35rem!important; border:1px solid rgba(191,219,254,.72)!important; border-radius:1.75rem!important; background:linear-gradient(180deg,rgba(255,255,255,.985),rgba(248,251,255,.985))!important; box-shadow:0 40px 100px rgba(15,23,42,.30),0 14px 36px rgba(21,28,117,.16),0 0 0 1px rgba(255,255,255,.55) inset!important; }
      #studio-smart-brief-modal .studio-smart-modal-card::before { content:'';display:block;height:5px;margin:-1.35rem -1.35rem 1.15rem;border-radius:1.75rem 1.75rem 0 0;background:linear-gradient(90deg,#151c75 0%,#3f48bf 58%,#f59e0b 100%); }
      #studio-smart-brief-modal #studio-smart-brief-input { min-height:148px;border-color:#d9e5f7!important;box-shadow:inset 0 1px 2px rgba(15,23,42,.03),0 8px 24px rgba(21,28,117,.05);font-size:1rem!important;line-height:1.55!important; }
    }

    /* Primary Hero Search */
    .studio-hero-primary-search { border-radius:999px!important; border:2px solid #eab308!important; background:rgba(255,255,255,.97)!important; box-shadow:0 8px 26px rgba(234,179,8,.13); transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease; }
    .studio-hero-primary-search:focus-within { border-color:#f59e0b!important; box-shadow:0 0 0 4px rgba(234,179,8,.13),0 12px 30px rgba(234,179,8,.16); transform:translateY(-1px); }
    .studio-hero-primary-search input { border:0!important; outline:0!important; box-shadow:none!important; background:transparent!important; border-radius:999px!important; font-size:1rem!important; }
    .studio-hero-primary-search input::placeholder { opacity:.72; }
    .studio-hero-primary-search button { border-radius:999px!important; position:relative; overflow:hidden; }
    .studio-hero-primary-search button .studio-magic-icon { display:inline-block; margin-right:.4rem; animation:studioMagicPulse 1.8s ease-in-out infinite; }
    .studio-hero-primary-search button::after { content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.38) 50%,transparent 75%);transform:translateX(-120%);animation:studioMagicSweep 3.2s ease-in-out infinite;pointer-events:none; }
    @keyframes studioMagicPulse { 0%,100%{transform:rotate(-6deg) scale(1)}50%{transform:rotate(8deg) scale(1.1)} }
    @keyframes studioMagicSweep { 0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)} }

    /* Smart Brief CTA */
    .studio-smart-search-cta { position:relative!important;isolation:isolate;overflow:hidden;border-radius:999px!important;transition:transform .2s ease,box-shadow .25s ease!important; }
    .studio-smart-search-cta::before { content:'';position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:conic-gradient(from 0deg,rgba(234,179,8,0),#f59e0b,#fde68a,#eab308,rgba(234,179,8,0));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.9;animation:studioAmberSweep 2.8s linear infinite;pointer-events:none;z-index:-1; }
    .studio-smart-search-cta:hover { transform:translateY(-1px);box-shadow:0 10px 24px rgba(234,179,8,.28)!important; }
    .studio-smart-search-cta .studio-smart-magic-icon { margin-right:.45rem;display:inline-block;animation:studioMagicPulse 1.8s ease-in-out infinite; }
    @keyframes studioAmberSweep { to { transform:rotate(360deg); } }

    /* Search notice */
    .studio-search-notice { display:flex;align-items:flex-start;gap:.55rem;margin:.65rem 0 0;padding:.65rem .8rem;border-radius:.85rem;background:rgba(245,158,11,.08);color:#7c4a03;font-size:.82rem;line-height:1.45; }
    .studio-search-notice i { margin-top:.12rem; }
    .studio-search-notice.is-error { background:rgba(239,68,68,.07);color:#991b1b; }

    #studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active { scroll-margin-top:1.25rem;animation:studioResultsIn .52s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes studioResultsIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

    /* Activity: transparent, left aligned, permanently available in the Hero. */
    .studio-live-activity { display:flex;align-items:center;justify-content:flex-start;flex-wrap:wrap;gap:.55rem 1.25rem;width:100%;margin:.75rem 0 0;padding:.1rem 0;background:transparent;border:0;box-shadow:none;backdrop-filter:none;text-align:left; }
    .studio-live-stat { display:inline-flex;align-items:center;justify-content:flex-start;gap:.42rem;min-height:1.8rem;padding:.15rem 0;background:transparent;color:rgba(255,255,255,.84);font-size:.76rem;font-weight:600;letter-spacing:.01em; }
    .studio-live-dot { width:.42rem;height:.42rem;flex:0 0 auto;border-radius:999px;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.10),0 0 10px rgba(74,222,128,.32);animation:studioLivePulse 1.8s ease-in-out infinite; }
    .studio-live-number { min-width:2.2ch;display:inline-block;color:#fff;font-size:.88rem;font-weight:800;font-variant-numeric:tabular-nums;transition:opacity .18s ease,transform .18s ease; }
    .studio-live-caption { white-space:nowrap; }
    @keyframes studioLivePulse { 50%{opacity:.55;transform:scale(.84)} }
    @media(max-width:640px){.studio-live-activity{gap:.45rem .9rem;margin-top:.6rem}.studio-live-stat{font-size:.72rem}}
    @media(prefers-reduced-motion:reduce){.studio-hero-primary-search button .studio-magic-icon,.studio-hero-primary-search button::after,.studio-smart-search-cta::before,.studio-smart-search-cta .studio-smart-magic-icon,.studio-live-dot,#studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active{animation:none!important}}
  `;
  document.head.appendChild(style);

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const visible = el => { if(!el)return false; const r=el.getBoundingClientRect(); const s=getComputedStyle(el); return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'; };

  function removeFooterWhitespaceNodes(){
    const footer=document.querySelector('body > footer.site-footer');if(!footer)return;
    let node=footer.nextSibling;
    while(node){const next=node.nextSibling;if(node.nodeType===Node.TEXT_NODE&&!String(node.nodeValue||'').trim())node.remove();else break;node=next;}
  }

  function notice(message,type='info',root=document){
    const host=root.querySelector?.('#studio-search-notice-host') || root;
    let box=host.querySelector?.('.studio-search-notice');
    if(!box){box=document.createElement('div');box.className='studio-search-notice';box.setAttribute('role','status');host.appendChild(box);}
    box.classList.toggle('is-error',type==='error');
    box.innerHTML=`<i class="fa-solid ${type==='error'?'fa-circle-exclamation':'fa-wand-magic-sparkles'}" aria-hidden="true"></i><span>${message}</span>`;
    window.clearTimeout(box._hideTimer);
    if(type!=='error')box._hideTimer=window.setTimeout(()=>box.remove(),6500);
    return box;
  }

  function findButtonByText(root,labels){
    const wanted=labels.map(normalize);
    for(const node of root.querySelectorAll('button,a,[role="button"]')){const label=normalize(node.textContent);if(visible(node)&&wanted.some(x=>label===x||label.includes(x)))return node;}
    return null;
  }

  function polishModal(){
    const modal=document.getElementById('studio-smart-brief-modal');const card=modal?.querySelector('.studio-smart-modal-card');if(!modal||!card)return;
    const cta=findButtonByText(card,['Cari yang Paling Nyambung']);
    if(cta){cta.classList.add('studio-smart-search-cta');if(!cta.querySelector('.studio-smart-magic-icon')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-smart-magic-icon';icon.setAttribute('aria-hidden','true');cta.prepend(icon);}}
    const input=document.getElementById('studio-smart-brief-input');if(input){input.style.fontSize='1rem';input.style.lineHeight='1.55';}
  }

  function findHeroSearch(){
    const candidates=[...document.querySelectorAll('input,textarea')].filter(visible).filter(el=>!el.closest('#studio-smart-brief-modal')).filter(el=>{
      const text=normalize([el.placeholder,el.getAttribute('aria-label'),el.getAttribute('name'),el.id].join(' '));
      return /(cari|search|kreator|creator|butuh|kebutuhan)/.test(text);
    });
    candidates.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);
    return candidates[0]||null;
  }

  function findSearchButton(input){
    const form=input?.closest('form');
    if(form){const b=form.querySelector('button[type="submit"],button');if(b)return b;}
    const parent=input?.parentElement?.parentElement||input?.parentElement;
    return parent?[...parent.querySelectorAll('button')].find(b=>/(cari|search)/.test(normalize(b.textContent))):null;
  }

  async function waitForStudioAI(timeout=8000){
    const started=Date.now();
    while(Date.now()-started<timeout){
      const smart=window.App?.studioAI;
      if(smart&&typeof smart.runSmartDiscovery==='function')return smart;
      await new Promise(resolve=>setTimeout(resolve,180));
    }
    return null;
  }

  function getResultCount(smart){
    const raw=smart?._smartLastResults;
    if(Array.isArray(raw))return raw.length;
    if(Array.isArray(smart?._smartResults))return smart._smartResults.length;
    return null;
  }

  async function runDiscoveryAndRender(smart,query,mode='smart'){
    const cleanQuery=String(query||'').trim();
    if(cleanQuery.length<2){notice('Coba tulis sedikit lebih detail ya — misalnya "AI Product untuk guru" atau "desain konten Instagram".');return false;}

    smart._query=cleanQuery;
    smart._creatorDisplayLimit=mode==='category'?1000:Math.max(Number(smart._creatorDisplayLimit||12),12);
    smart._smartLastResults=[];

    try{
      const result=await Promise.resolve(smart.runSmartDiscovery());
      if(Array.isArray(result)&&result.length)smart._smartLastResults=result;
      if(typeof smart.renderCreators==='function')await Promise.resolve(smart.renderCreators());

      const count=getResultCount(smart);
      if(count===0){
        notice('Hmm, belum ketemu Creator yang cukup nyambung. Coba pakai kata kunci yang lebih spesifik, ya — misalnya sebutkan kebutuhan, jenis produk, atau hasil yang kamu cari.','error');
        return false;
      }

      const creatorSec=document.getElementById('studio-ai-creator-section');
      const categorySec=document.getElementById('studio-ai-category-section');
      if(!creatorSec){notice('Hasilnya sudah dicari, tapi area Creator belum siap ditampilkan. Coba sebentar lagi.','error');return false;}
      if(mode==='smart'&&categorySec)categorySec.classList.add('hidden');
      creatorSec.classList.remove('hidden','studio-smart-results-active','studio-category-results-active');
      void creatorSec.offsetWidth;
      creatorSec.classList.add(mode==='category'?'studio-category-results-active':'studio-smart-results-active');
      if(mode==='category')creatorSec.dataset.activeCategory=cleanQuery;else delete creatorSec.dataset.activeCategory;
      window.setTimeout(()=>creatorSec.scrollIntoView({behavior:'smooth',block:'start'}),100);
      return true;
    }catch(error){
      console.error('[Studio AI] Smart discovery failed:',error);
      notice('Ups, pencariannya belum siap. Tenang, bukan kamu yang salah 😄 Tunggu sebentar lalu coba lagi, ya.','error');
      return false;
    }
  }

  function installSmartButtonDelegation(){
    if(document.documentElement.dataset.studioSmartDelegatedV5==='1')return;
    document.addEventListener('click',async event=>{
      const modal=document.getElementById('studio-smart-brief-modal');
      if(!modal||!visible(modal))return;
      const target=event.target.closest('button,a,[role="button"]');
      if(!target||!modal.contains(target)||normalize(target.textContent)!=='cari yang paling nyambung')return;
      event.preventDefault();event.stopImmediatePropagation();

      const input=document.getElementById('studio-smart-brief-input');
      const query=String(input?.value||'').trim();
      if(query.length<2){notice('Ceritakan kebutuhanmu dulu ya 😊 Boleh santai, misalnya: "Aku butuh Creator untuk bikin AI Product."', 'info', modal.querySelector('.studio-smart-modal-card')||modal);input?.focus();return;}

      target.disabled=true;target.setAttribute('aria-busy','true');
      try{
        const smart=await waitForStudioAI();
        if(!smart){notice('Studio AI masih menyiapkan mesin pencari. Tunggu sebentar ya, lalu tekan lagi — tidak perlu menulis ulang.','info',modal.querySelector('.studio-smart-modal-card')||modal);return;}
        const ok=await runDiscoveryAndRender(smart,query,'smart');
        if(ok&&typeof smart.closeSmartBrief==='function')smart.closeSmartBrief();
      }finally{target.disabled=false;target.removeAttribute('aria-busy');}
    },true);
    document.documentElement.dataset.studioSmartDelegatedV5='1';
  }

  function installHeroSearch(){
    const input=findHeroSearch();if(!input)return false;
    const button=findSearchButton(input);
    const wrapper=input.closest('form')||input.parentElement?.parentElement||input.parentElement;
    if(wrapper)wrapper.classList.add('studio-hero-primary-search');
    if(button){button.setAttribute('aria-label','Cari Creator dengan AI');if(!button.querySelector('.studio-magic-icon')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-magic-icon';icon.setAttribute('aria-hidden','true');button.prepend(icon);}}
    if(input.dataset.studioHeroSearchBoundV5==='1')return true;

    const submit=async event=>{
      event?.preventDefault();event?.stopImmediatePropagation();
      const query=String(input.value||'').trim();
      if(query.length<2){notice('Tulis kebutuhanmu dulu ya 😊 Contoh: "butuh Creator AI Product untuk guru".');input.focus();return;}
      if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
      try{
        const smart=await waitForStudioAI();
        if(!smart){notice('Studio AI sedang menyiapkan mesin pencari. Coba tekan lagi sebentar ya — teksmu tetap aman.','info');return;}
        await runDiscoveryAndRender(smart,query,'smart');
      }finally{if(button){button.disabled=false;button.removeAttribute('aria-busy');}}
    };

    input.addEventListener('keydown',event=>{if(event.key==='Enter')submit(event)},true);
    if(button)button.addEventListener('click',submit,true);
    const form=input.closest('form');if(form)form.addEventListener('submit',submit,true);
    input.dataset.studioHeroSearchBoundV5='1';
    return true;
  }

  function installCategoryDiscovery(){
    const categorySec=document.getElementById('studio-ai-category-section');if(!categorySec||categorySec.dataset.smartCategoryBoundV5==='1')return false;
    categorySec.addEventListener('click',async event=>{
      const target=event.target.closest('[data-category],[data-category-name],button,a,[role="button"]');if(!target||!categorySec.contains(target))return;
      const explicit=target.getAttribute('data-category')||target.getAttribute('data-category-name');
      const category=String(explicit||target.textContent||'').split(/\s+\|\s+|\n/)[0].trim();
      if(category.length<2)return;
      event.preventDefault();event.stopImmediatePropagation();
      const smart=await waitForStudioAI();
      if(!smart){notice('Studio AI masih loading sebentar ya. Coba pilih kategori lagi dalam beberapa detik.');return;}
      await runDiscoveryAndRender(smart,category,'category');
    },true);
    categorySec.dataset.smartCategoryBoundV5='1';return true;
  }

  function findHeroControls(){
    const labels=['Ceritakan kebutuhanmu','Kategori','Creator'];const found=[];
    for(const label of labels){
      const wanted=normalize(label);const nodes=[...document.querySelectorAll('button,a,[role="button"]')].filter(visible).filter(el=>{const t=normalize(el.textContent);return t===wanted||t.includes(wanted);});
      nodes.sort((a,b)=>a.getBoundingClientRect().top-b.getBoundingClientRect().top);if(nodes[0])found.push(nodes[0]);
    }
    return found;
  }

  function installActivity(){
    const controls=findHeroControls();if(controls.length<2)return false;
    const anchor=controls[controls.length-1];let wrap=document.getElementById('studio-live-activity');
    if(!wrap){wrap=document.createElement('div');wrap.id='studio-live-activity';wrap.className='studio-live-activity';wrap.setAttribute('aria-label','Aktivitas Creator dan Pengunjung');wrap.innerHTML='<div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Creator Aktif</span><span id="studio-live-creators" class="studio-live-number">29</span></div><div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Pengunjung</span><span id="studio-live-visitors" class="studio-live-number">157</span></div>';
      anchor.insertAdjacentElement('afterend',wrap);
    }else if(wrap.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',wrap);
    if(wrap.dataset.boundV5==='1')return true;

    const state={creators:29,visitors:157};
    const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
    const profile=()=>{const h=new Date().getHours();if(h<5)return{c:26,v:112};if(h<9)return{c:39,v:190};if(h<15)return{c:53,v:270};if(h<19)return{c:60,v:335};if(h<23)return{c:52,v:300};return{c:35,v:185};};
    const tick=key=>{const p=profile();const min=key==='creators'?23:89;const max=key==='creators'?76:387;const target=key==='creators'?p.c:p.v;const current=state[key];let step=target===current?0:(target>current?1:-1)*(1+Math.floor(Math.random()*3));if(Math.random()<.18)step=Math.random()<.5?-1:1;state[key]=clamp(current+step,min,max);const node=document.getElementById(key==='creators'?'studio-live-creators':'studio-live-visitors');if(!node)return;node.style.opacity='.45';node.style.transform='translateY(-2px)';window.setTimeout(()=>{node.textContent=String(state[key]);node.style.opacity='1';node.style.transform='translateY(0)';},120);};
    const schedule=key=>window.setTimeout(()=>{tick(key);schedule(key);},3000+Math.floor(Math.random()*7001));
    schedule('creators');schedule('visitors');wrap.dataset.boundV5='1';return true;
  }

  function install(){removeFooterWhitespaceNodes();polishModal();installSmartButtonDelegation();installHeroSearch();installCategoryDiscovery();installActivity();}
  install();
  let tries=0;const timer=window.setInterval(()=>{tries++;install();if(tries>=160)window.clearInterval(timer);},150);
  const observer=new MutationObserver(()=>install());if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
