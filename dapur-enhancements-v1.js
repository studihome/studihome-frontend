(()=>{
'use strict';

// Small, isolated compatibility layer for the standalone Dapur app.
// It intentionally avoids changing Supabase, routing, or business logic.
window.$=window.$||((selector,root=document)=>root.querySelector(selector));
window.$$=window.$$||((selector,root=document)=>[...root.querySelectorAll(selector)]);

const polish=()=>{
  const app=document.getElementById('app');
  if(!app)return;

  // Keep exactly one primary Foyer entry in the workspace.
  const foyer=[...app.querySelectorAll('[data-step="0"]')];
  foyer.slice(1).forEach(el=>el.remove());

  // Lightweight enter animation for main sections/cards.
  [...app.querySelectorAll('section, [data-step], aside')].forEach((el,i)=>{
    if(el.dataset.dapurMotion==='1')return;
    el.dataset.dapurMotion='1';
    el.classList.add('dapur-enter');
    el.style.setProperty('--dapur-delay',`${Math.min(i,8)*45}ms`);
  });
};

const start=()=>{
  polish();
  const app=document.getElementById('app');
  if(!app)return;
  // Observe only the Dapur app container, never document/body.
  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;polish()});
  });
  observer.observe(app,{childList:true,subtree:true});
};

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
