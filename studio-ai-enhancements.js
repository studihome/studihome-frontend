(() => {
  'use strict';

  if (window.__STUDIO_AI_ENHANCEMENTS_V3__) return;
  window.__STUDIO_AI_ENHANCEMENTS_V3__ = true;

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/studio-ai') return;

  const style = document.createElement('style');
  style.id = 'studio-ai-enhancements-v3';
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
    .studio-smart-search-cta { position:relative!important;isolation:isolate;overflow:hidden;border-radius:999px!important;transition:transform .2s ease,box-shadow .25s ease!important; }
    .studio-smart-search-cta::before { content:'';position:absolute;inset:-2px;border-radius:inherit;padding:2px;background:conic-gradient(from 0deg,rgba(234,179,8,0),#f59e0b,#fde68a,#eab308,rgba(234,179,8,0));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.9;animation:studioAmberSweep 2.8s linear infinite;pointer-events:none;z-index:-1; }
    .studio-smart-search-cta:hover { transform:translateY(-1px);box-shadow:0 10px 24px rgba(234,179,8,.28)!important; }
    .studio-smart-search-cta .studio-smart-magic-icon { margin-right:.45rem;display:inline-block;animation:studioMagicFloat 1.8s ease-in-out infinite; }
    @keyframes studioAmberSweep { to { transform:rotate(360deg); } }
    @keyframes studioMagicFloat { 0%,100%{transform:rotate(-7deg) scale(1)} 50%{transform:rotate(8deg) scale(1.08)} }
    #studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active { scroll-margin-top:1.25rem;animation:studioResultsIn .52s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes studioResultsIn { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
    .studio-live-activity { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;width:min(780px,calc(100% - 2rem));margin:1rem auto 0;padding:.8rem;border:1px solid rgba(209,226,255,.86);border-radius:1.1rem;background:rgba(255,255,255,.72);box-shadow:0 10px 30px rgba(21,28,117,.06);backdrop-filter:blur(10px); }
    .studio-live-stat { display:flex;align-items:center;justify-content:center;gap:.55rem;min-height:2.7rem;padding:.45rem .7rem;border-radius:.85rem;background:rgba(248,251,255,.9);color:#334155;font-size:.78rem;font-weight:600; }
    .studio-live-dot { width:.48rem;height:.48rem;flex:0 0 auto;border-radius:999px;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.10);animation:studioLivePulse 1.8s ease-in-out infinite; }
    .studio-live-number { min-width:2.2ch;display:inline-block;color:#151c75;font-size:.95rem;font-weight:800;font-variant-numeric:tabular-nums;transition:opacity .18s ease,transform .18s ease; }
    .studio-live-caption { white-space:nowrap; }
    @keyframes studioLivePulse { 50%{opacity:.58;transform:scale(.86)} }
    @media(max-width:640px){.studio-live-activity{grid-template-columns:1fr;width:min(100% - 1rem,780px);margin-top:.8rem}}
    @media(prefers-reduced-motion:reduce){.studio-smart-search-cta::before,.studio-smart-search-cta .studio-smart-magic-icon,.studio-live-dot,#studio-ai-creator-section.studio-smart-results-active,#studio-ai-creator-section.studio-category-results-active{animation:none!important}}
  `;
  document.head.appendChild(style);

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();

  function removeFooterWhitespaceNodes(){
    const footer=document.querySelector('body > footer.site-footer'); if(!footer)return;
    let node=footer.nextSibling;
    while(node){const next=node.nextSibling;if(node.nodeType===Node.TEXT_NODE&&!String(node.nodeValue||'').trim())node.remove();else break;node=next;}
  }

  function findButtonByText(root,labels){
    const wanted=labels.map(normalize);
    for(const node of root.querySelectorAll('button,a,[role="button"]')){
      const label=normalize(node.textContent);if(wanted.some(x=>label===x||label.includes(x)))return node;
    }
    return null;
  }

  function polishModal(){
    const modal=document.getElementById('studio-smart-brief-modal');const card=modal?.querySelector('.studio-smart-modal-card');if(!modal||!card)return;
    const actions=card.querySelector(':scope > .mt-5.flex.flex-wrap.justify-end.gap-2');if(actions)actions.classList.add('studio-smart-brief-actions');
    const cta=findButtonByText(card,['Cari yang Paling Nyambung']);
    if(cta){cta.classList.add('studio-smart-search-cta');if(!cta.querySelector('.studio-smart-magic-icon')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-smart-magic-icon';icon.setAttribute('aria-hidden','true');cta.prepend(icon);}}
  }

  function showCreatorResults(smart,mode='smart',label=''){
    const creatorSec=document.getElementById('studio-ai-creator-section');const categorySec=document.getElementById('studio-ai-category-section');if(!creatorSec)return;
    if(mode==='smart'&&categorySec)categorySec.classList.add('hidden');
    creatorSec.classList.remove('hidden','studio-smart-results-active','studio-category-results-active');void creatorSec.offsetWidth;creatorSec.classList.add(mode==='category'?'studio-category-results-active':'studio-smart-results-active');
    if(mode==='category'&&label)creatorSec.dataset.activeCategory=label;else delete creatorSec.dataset.activeCategory;
    if(typeof smart.renderCreators==='function')smart.renderCreators();
    window.setTimeout(()=>creatorSec.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  async function runDiscoveryAndRender(smart,query,mode='smart'){
    const cleanQuery=String(query||'').trim();if(!cleanQuery||cleanQuery.length<2)return false;
    smart._query=cleanQuery;smart._creatorDisplayLimit=Math.max(Number(smart._creatorDisplayLimit||6),6);smart._smartLastResults=[];
    try{await Promise.resolve(smart.runSmartDiscovery());showCreatorResults(smart,mode,cleanQuery);return true;}catch(error){console.error('[Studio AI] discovery failed:',error);App.ui?.toast?.('Pencarian belum berhasil. Coba kata kunci yang lebih spesifik.','error');return false;}
  }

  function installSmartSubmitPatch(){
    const smart=window.App?.studioAI;if(!smart||typeof smart.submitSmartBrief!=='function'||smart.__smartSubmitPatchedV3)return false;
    const originalSubmit=smart.submitSmartBrief.bind(smart);
    smart.submitSmartBrief=async function(...args){
      const input=document.getElementById('studio-smart-brief-input');const briefText=String(input?.value||'').trim();
      if(!briefText||briefText.length<2)return originalSubmit(...args);
      const ok=await runDiscoveryAndRender(this,briefText,'smart');
      if(ok&&typeof this.closeSmartBrief==='function')this.closeSmartBrief();
      return ok;
    };
    smart.__smartSubmitPatchedV3=true;return true;
  }

  function installCategoryDiscovery(){
    const categorySec=document.getElementById('studio-ai-category-section');const smart=window.App?.studioAI;if(!categorySec||!smart||categorySec.dataset.smartCategoryBound==='1')return false;
    categorySec.addEventListener('click',async event=>{
      const target=event.target.closest('[data-category],[data-category-name],button,a,[role="button"]');if(!target||!categorySec.contains(target))return;
      const explicit=target.getAttribute('data-category')||target.getAttribute('data-category-name');const text=String(explicit||target.textContent||'').trim();if(!text)return;
      const category=text.split(/\s+\|\s+|\n/)[0].trim();if(category.length<2)return;
      event.preventDefault();event.stopPropagation();await runDiscoveryAndRender(smart,category,'category');
    },true);
    categorySec.dataset.smartCategoryBound='1';return true;
  }

  function installActivityIndicator(){
    if(document.getElementById('studio-live-activity'))return true;
    const creatorSec=document.getElementById('studio-ai-creator-section');const categorySec=document.getElementById('studio-ai-category-section');const anchor=creatorSec||categorySec;if(!anchor?.parentNode)return false;
    const wrap=document.createElement('div');wrap.id='studio-live-activity';wrap.className='studio-live-activity';wrap.setAttribute('aria-label','Indikator aktivitas dinamis');wrap.innerHTML='<div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Creator Aktif</span><span id="studio-live-creators" class="studio-live-number">34</span></div><div class="studio-live-stat"><span class="studio-live-dot" aria-hidden="true"></span><span class="studio-live-caption">Pengunjung</span><span id="studio-live-visitors" class="studio-live-number">91</span></div>';
    anchor.parentNode.insertBefore(wrap,anchor);
    const state={creators:34,visitors:91},ranges={creators:[23,76],visitors:[89,237]};
    const nextValue=(current,[min,max])=>{const maxStep=Math.max(3,Math.round((max-min)*.06));const step=Math.floor(Math.random()*(maxStep*2+1))-maxStep;return Math.min(max,Math.max(min,current+step+(Math.random()<.16?(Math.random()<.5?-1:1)*Math.ceil(Math.random()*5):0)));};
    const schedule=key=>{const delay=1000+Math.floor(Math.random()*4000);window.setTimeout(()=>{const node=document.getElementById(key==='creators'?'studio-live-creators':'studio-live-visitors');state[key]=nextValue(state[key],ranges[key]);if(node){node.style.opacity='.45';node.style.transform='translateY(-2px)';window.setTimeout(()=>{node.textContent=String(state[key]);node.style.opacity='1';node.style.transform='translateY(0)';},110);}schedule(key);},delay);};
    schedule('creators');schedule('visitors');return true;
  }

  function installSearchInputPolish(){
    const input=document.getElementById('studio-smart-brief-input');if(!input||input.dataset.smartInputPolished==='1')return false;input.dataset.smartInputPolished='1';input.style.borderRadius='1.15rem';return true;
  }

  function install(){removeFooterWhitespaceNodes();polishModal();installCategoryDiscovery();installActivityIndicator();installSearchInputPolish();installSmartSubmitPatch();}
  install();
  let tries=0;const timer=window.setInterval(()=>{tries++;install();if(tries>=120)window.clearInterval(timer);},150);
  const observer=new MutationObserver(()=>install());if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
