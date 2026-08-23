(function(){
  'use strict';
  if(window.__DAPUR_UI_TWEAKS_V1__) return;
  window.__DAPUR_UI_TWEAKS_V1__=true;

  const text=(node)=>String(node?.textContent||'').trim();
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
      const keep=allowed.test(title);
      step.hidden=!keep;
    });
    const grid=steps[0]?.parentElement;
    if(grid) grid.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
  };

  const prefillFoyer=()=>{
    const form=document.querySelector('#de-form');
    if(!form) return;
    const inputs=[...form.querySelectorAll('input,textarea')];
    const hasWhatsapp=inputs.some(i=>/whatsapp/i.test(i.name||''));
    const hasLocation=inputs.some(i=>/location|lokasi|address|alamat/i.test(i.name||''));
    if(!hasWhatsapp && !hasLocation) return;

    const source=window.__DAPUR_UI_TWEAKS_PREFILL__;
    if(!source) return;
    inputs.forEach(input=>{
      const name=String(input.name||'').toLowerCase();
      if(/whatsapp/.test(name) && !input.value) input.value=source.whatsapp||'';
      if(/location|lokasi|address|alamat/.test(name) && !input.value) input.value=source.location||'';
    });
  };

  const afterFoyerOpen=()=>setTimeout(prefillFoyer,0);

  const init=()=>{
    renameProfileAction();
    limitWorkspaceSteps();
    document.addEventListener('click',event=>{
      const target=event.target?.closest?.('button,a');
      if(!target) return;
      if(text(target)==='Edit Foyer' || text(target)==='Edit Profil') afterFoyerOpen();
    },{passive:true});
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
