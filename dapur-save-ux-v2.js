(()=>{
'use strict';
if(window.__DAPUR_SAVE_UX_V2__)return;
window.__DAPUR_SAVE_UX_V2__=true;
const toast=(m,t='success')=>window.App?.ui?.toast?.(m,t);
let pending=false;
const hasEditor=()=>!!document.querySelector('.de-modal');
const observer=new MutationObserver(()=>{if(pending&&!hasEditor()){pending=false;toast('Perubahan berhasil disimpan.','success')}});
function bind(){document.querySelectorAll('.de-modal form#de-form').forEach(form=>{if(form.dataset.saveUxV2==='1')return;form.dataset.saveUxV2='1';form.addEventListener('submit',()=>{pending=true},{capture:true})})}
function boot(){bind();observer.observe(document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
})();