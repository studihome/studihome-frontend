(function(){
  'use strict';
  if(window.__DAPUR_UI_TWEAKS_V1__) return;
  window.__DAPUR_UI_TWEAKS_V1__=true;

  const text=(node)=>String(node?.textContent||'').trim();
  const getClient=()=>window.supabaseClient;

  const ensureStyle=()=>{
    if(document.getElementById('dapur-ui-tweaks-v1-style')) return;
    const style=document.createElement('style');
    style.id='dapur-ui-tweaks-v1-style';
    style.textContent='.dapur-three-step-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}@media(max-width:768px){.dapur-three-step-grid{grid-template-columns:1fr!important}}';
    document.head.appendChild(style);
  };

  const renameProfileAction=()=>{
    document.querySelectorAll('button,a').forEach(el=>{
      if(text(el)==='Edit Profil') el.textContent='Edit Foyer';
    });
  };

  const limitWorkspaceSteps=()=>{
    const steps=[...document.querySelectorAll('.steps > .step')];
    if(!steps.length) return;
    const allowed=/^(menu|hidangan|ambalan)$/i;
    steps.forEach(step=>{
      const title=text(step.querySelector('h3'));
      step.hidden=!allowed.test(title);
    });
    const grid=steps[0]?.parentElement;
    if(grid) grid.classList.add('dapur-three-step-grid');
  };

  const prefillFoyer=async()=>{
    const form=document.querySelector('#de-form');
    if(!form) return;
    const inputs=[...form.querySelectorAll('input,textarea')];
    const whatsappInput=inputs.find(i=>/whatsapp/i.test(i.name||''));
    const locationInput=inputs.find(i=>/location|lokasi|address|alamat/i.test(i.name||''));
    if(!whatsappInput && !locationInput) return;
    if(whatsappInput?.value && locationInput?.value) return;
    try{
      const c=getClient(), hardening=window.DapurProductionHardening;
      if(!c||!hardening?.owner) return;
      const owner=await hardening.owner();
      const q=await c.from('creator_profiles').select('*').eq('id',owner.id).maybeSingle();
      if(q.error||!q.data) return;
      const row=q.data;
      if(whatsappInput&&!whatsappInput.value) whatsappInput.value=row.whatsapp||row.whatsapp_number||row.phone||'';
      if(locationInput&&!locationInput.value) locationInput.value=row.location||row.address||row.city||'';
    }catch(error){
      console.warn('[Dapur UI] Foyer prefill skipped:',error?.message||error);
    }
  };

  const init=()=>{
    ensureStyle();
    renameProfileAction();
    limitWorkspaceSteps();
    document.addEventListener('click',event=>{
      const target=event.target?.closest?.('button,a');
      if(!target) return;
      if(text(target)==='Edit Foyer' || text(target)==='Edit Profil') setTimeout(prefillFoyer,0);
    },{passive:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
