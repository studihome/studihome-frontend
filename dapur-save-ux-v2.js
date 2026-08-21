(()=>{
'use strict';
if(window.__DAPUR_SAVE_UX_V2__)return;
window.__DAPUR_SAVE_UX_V2__=true;
const isEditor=()=>!!document.querySelector('.de-modal');
let pending=false;
const toast=(m,t='success')=>window.App?.ui?.toast?.(m,t);
const observer=new MutationObserver(()=>{
  if(pending&&!isEditor()){
    pending=false;
    toast('Perubahan berhasil disimpan.','success');
  }
});
const bind=()=>{
  document.querySelectorAll('.de-modal form#de-form').forEach(form=>{
    if(form.dataset.saveUxV2==='1')return;
    form.dataset.saveUxV2='1';
    form.addEventListener('submit',()=>{pending=true},{capture:true});
  });
};
const boot=()=>{bind();observer.observe(document.body,{childList:true,subtree:true});};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
})();