(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/studio-ai' && !PATH.startsWith('/studio-ai/')) return;
  if (window.__STUDIO_AI_SEARCH_V2__) return;
  window.__STUDIO_AI_SEARCH_V2__ = true;

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const visible = el => { if (!el) return false; const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };

  const style = document.createElement('style');
  style.id = 'studio-ai-search-v2-style';
  style.textContent = `
    .studio-ai-hero-search-v2 { border-radius:999px!important; border:2px solid #eab308!important; background:rgba(255,255,255,.98)!important; box-shadow:0 8px 26px rgba(234,179,8,.12); transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease; }
    .studio-ai-hero-search-v2:focus-within { border-color:#f59e0b!important; box-shadow:0 0 0 4px rgba(234,179,8,.13),0 14px 32px rgba(234,179,8,.15); transform:translateY(-1px); }
    .studio-ai-hero-search-v2 input { min-height:44px!important; font-size:16px!important; line-height:1.45!important; border:0!important; outline:0!important; box-shadow:none!important; background:transparent!important; border-radius:999px!important; }
    .studio-ai-hero-search-v2 button { min-height:42px!important; border-radius:999px!important; position:relative!important; overflow:hidden!important; }
    .studio-ai-hero-search-v2 .studio-search-magic-v2 { display:inline-block; margin-right:.4rem; animation:studioMagicV2 1.8s ease-in-out infinite; }
    .studio-ai-hero-search-v2 button::after { content:'';position:absolute;inset:0;border-radius:inherit;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.4) 50%,transparent 75%);transform:translateX(-120%);animation:studioSweepV2 3.4s ease-in-out infinite;pointer-events:none; }
    @keyframes studioMagicV2 { 0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(7deg) scale(1.1)} }
    @keyframes studioSweepV2 { 0%,55%{transform:translateX(-120%)}75%,100%{transform:translateX(120%)} }
    .studio-ai-search-hint-v2 { margin-top:.55rem; color:rgba(219,234,254,.9); font-size:.78rem; line-height:1.45; }
    .studio-ai-search-hint-v2 strong { color:#facc15; }
    .studio-ai-search-notice-v2 { margin-top:.6rem; padding:.65rem .8rem; border-radius:.8rem; background:rgba(245,158,11,.09); color:#fde68a; font-size:.8rem; line-height:1.45; }
    .studio-ai-search-notice-v2.error { background:rgba(239,68,68,.12); color:#fecaca; }
    #studio-ai-creator-section.studio-search-results-v2 { scroll-margin-top:1rem; animation:studioResultsV2 .45s cubic-bezier(.2,.75,.25,1) both; }
    @keyframes studioResultsV2 { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
    @media(prefers-reduced-motion:reduce){.studio-ai-hero-search-v2,.studio-ai-hero-search-v2 .studio-search-magic-v2,.studio-ai-hero-search-v2 button::after,#studio-ai-creator-section.studio-search-results-v2{animation:none!important;transition:none!important;transform:none!important}}
  `;
  document.head.appendChild(style);

  function removeBrief() {
    document.getElementById('studio-smart-brief-modal')?.remove();
    document.querySelectorAll('button,a,[role="button"]').forEach(el => {
      if (normalize(el.textContent) === 'ceritakan kebutuhanmu') el.remove();
    });
  }

  function findHeroSearch() {
    const candidates = [...document.querySelectorAll('input,textarea')]
      .filter(visible)
      .filter(el => !el.closest('#studio-smart-brief-modal'))
      .filter(el => {
        const meta = normalize([el.id,el.name,el.placeholder,el.getAttribute('aria-label')].join(' '));
        return /(cari|search|kreator|creator|kebutuhan|layanan|butuh)/.test(meta);
      });
    candidates.sort((a,b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    return candidates[0] || null;
  }

  function findButton(input) {
    const form = input?.closest('form');
    if (form) return form.querySelector('button[type="submit"],button');
    const parent = input?.parentElement?.parentElement || input?.parentElement;
    return parent ? [...parent.querySelectorAll('button')].find(b => /(cari|search)/.test(normalize(b.textContent))) || parent.querySelector('button') : null;
  }

  function notice(input,message,error=false) {
    const host = input?.closest('.studio-ai-hero') || input?.parentElement?.parentElement || input?.parentElement || document.body;
    let box = host.querySelector?.('.studio-ai-search-notice-v2');
    if (!box) { box=document.createElement('div'); box.className='studio-ai-search-notice-v2'; host.appendChild(box); }
    box.classList.toggle('error',error); box.textContent=message;
    clearTimeout(box._timer); box._timer=setTimeout(()=>box.remove(),6500);
  }

  function engine() { const smart=window.App?.studioAI; return smart && typeof smart.runSmartDiscovery==='function' ? smart : null; }
  async function waitEngine(timeout=8000) { const start=Date.now(); while(Date.now()-start<timeout){const smart=engine();if(smart)return smart;await new Promise(r=>setTimeout(r,150));} return null; }

  async function search(input,button) {
    const query=String(input?.value||'').trim();
    if(query.length<2){notice(input,'Tulis keyword dulu ya 😄 Misalnya “video”, “website”, “AI Product”, atau “otomasi WhatsApp”.');input?.focus();return;}
    const smart=await waitEngine();
    if(!smart){notice(input,'Mesin pencarian masih siap-siap sebentar. Coba tekan Cari lagi ya — tidak perlu mengetik ulang.');return;}
    const creatorSec=document.getElementById('studio-ai-creator-section');
    if(!creatorSec){notice(input,'Area hasil Creator belum siap ditampilkan. Coba sebentar lagi ya.',true);return;}
    smart._query=query;
    smart._creatorDisplayLimit=Math.max(Number(smart._creatorDisplayLimit||12),12);
    try {
      const result=await Promise.resolve(smart.runSmartDiscovery());
      if(Array.isArray(result) && result.length===0){notice(input,`Belum ketemu Creator yang cukup nyambung dengan “${query}”. Coba tambahkan sedikit konteks ya 😊`);return;}
      if(typeof smart.renderCreators==='function') await Promise.resolve(smart.renderCreators());
      creatorSec.classList.remove('hidden','studio-search-results-v2');
      void creatorSec.offsetWidth;
      creatorSec.classList.add('studio-search-results-v2');
      window.setTimeout(()=>creatorSec.scrollIntoView({behavior:'smooth',block:'start'}),100);
    } catch(error) {
      console.error('[Studihome Studio AI Search]',error);
      notice(input,'Ups, pencariannya sempat tersendat 😄 Coba tekan Cari sekali lagi ya.',true);
    }
  }

  function bind() {
    const input=findHeroSearch(); if(!input)return false;
    const button=findButton(input);
    const wrap=input.closest('form')||input.parentElement?.parentElement||input.parentElement;
    wrap?.classList.add('studio-ai-hero-search-v2');
    if(button){
      button.setAttribute('aria-label','Cari Creator');
      if(!button.querySelector('.studio-search-magic-v2')){const icon=document.createElement('i');icon.className='fa-solid fa-wand-magic-sparkles studio-search-magic-v2';icon.setAttribute('aria-hidden','true');button.prepend(icon);}
    }
    if(!wrap?.parentElement?.querySelector('.studio-ai-search-hint-v2')){const hint=document.createElement('div');hint.className='studio-ai-search-hint-v2';hint.innerHTML='<strong>Cari bebas:</strong> ketik “video”, “website”, “AI Product”, atau apa pun yang kamu butuhkan.';wrap?.insertAdjacentElement('afterend',hint);}
    if(input.dataset.studioSearchV2Bound==='1')return true;
    const run=e=>{e?.preventDefault();e?.stopImmediatePropagation();void search(input,button);};
    input.addEventListener('keydown',e=>{if(e.key==='Enter')run(e)},true);
    button?.addEventListener('click',run,true);
    input.closest('form')?.addEventListener('submit',run,true);
    input.dataset.studioSearchV2Bound='1';
    return true;
  }

  function install(){removeBrief();bind();}
  install();
  let tries=0;const timer=setInterval(()=>{tries++;install();if(tries>=120)clearInterval(timer)},150);
  const observer=new MutationObserver(()=>install());
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
})();
