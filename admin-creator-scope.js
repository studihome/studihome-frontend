(()=>{
'use strict';

const ADMIN_PATH='/admin';
const supa=()=>window.supabaseClient;
const esc=v=>window.App?.utils?.escapeHtml?window.App.utils.escapeHtml(v):String(v??'');
const toast=(m,t='info')=>window.App?.ui?.toast?.(m,t);

function isAdmin(){return location.pathname===ADMIN_PATH;}
function findTab(label){
  const target=String(label).trim().toLowerCase();
  return [...document.querySelectorAll('button')].find(b=>String(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase()===target);
}
function adminArea(){return document.getElementById('admin-content-area');}

async function loadExternalCreators(){
  const {data,error}=await supa().from('creator_profiles')
    .select('id,username,display_name,bio,avatar_url,location,is_published,is_verified,review_status,updated_at,managed_by_studihome,is_studihome_official')
    .eq('managed_by_studihome',false)
    .order('display_name',{ascending:true});
  if(error) throw error;
  return data||[];
}

function renderCard(c){
  const status=c.is_published?'Published':'Draft';
  const verification=c.is_verified?'Verified':'Belum verified';
  return `<details class="admin-external-creator card-3d rounded-2xl bg-white overflow-hidden" data-search="${esc(`${c.display_name||''} ${c.username||''} ${c.location||''}`).toLowerCase()}">
    <summary class="list-none cursor-pointer p-3.5 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">
          ${c.avatar_url?`<img src="${esc(c.avatar_url)}" class="w-full h-full object-contain bg-white" alt="">`:`<span class="font-black text-[#151c75]">${esc(String(c.display_name||'C').charAt(0).toUpperCase())}</span>`}
        </div>
        <div class="min-w-0">
          <div class="text-xs font-extrabold text-[#151c75] truncate">${esc(c.display_name||c.username)}</div>
          <div class="text-[9px] text-slate-400 truncate">@${esc(c.username)} · ${status} · ${verification}</div>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0"><span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-blue-50 text-[#151c75]">Creator Member</span><i class="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i></div>
    </summary>
    <div class="border-t border-slate-100 p-4 grid lg:grid-cols-2 gap-3">
      <section class="card-3d-inset rounded-xl p-3">
        <div class="text-[9px] uppercase tracking-[.1em] font-black text-blue-600">Identitas</div>
        <div class="mt-2 space-y-1.5 text-[10px]">
          <div class="flex justify-between gap-3"><span class="text-slate-500">Nama</span><span class="font-bold text-right">${esc(c.display_name||'-')}</span></div>
          <div class="flex justify-between gap-3"><span class="text-slate-500">Username</span><span class="font-bold text-right">@${esc(c.username||'-')}</span></div>
          <div class="flex justify-between gap-3"><span class="text-slate-500">Lokasi</span><span class="font-bold text-right">${esc(c.location||'-')}</span></div>
        </div>
      </section>
      <section class="card-3d-inset rounded-xl p-3">
        <div class="text-[9px] uppercase tracking-[.1em] font-black text-blue-600">Governance</div>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <span class="px-2 py-1 rounded-lg bg-slate-50 text-slate-600 text-[9px] font-bold">${esc(status)}</span>
          <span class="px-2 py-1 rounded-lg ${c.is_verified?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'} text-[9px] font-bold">${esc(verification)}</span>
          <span class="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-[9px] font-bold">${esc(c.review_status||'—')}</span>
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <a href="/${encodeURIComponent(c.username||'')}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-bold text-[#151c75]">Lihat Profil</a>
          <button type="button" class="px-3 py-2 rounded-xl bg-slate-50 text-[10px] font-bold text-slate-700" onclick="window.AdminCreatorScope.openGovernance('${c.id}')">Governance</button>
        </div>
      </section>
    </div>
  </details>`;
}

async function render(){
  if(!isAdmin()||!supa())return;
  const area=adminArea(); if(!area)return;
  area.innerHTML='<div class="py-10 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Creator Member…</div>';
  try{
    const rows=await loadExternalCreators();
    area.innerHTML=`<div class="space-y-5">
      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <div class="text-[9px] font-black uppercase tracking-[.1em] text-blue-600">CREATOR · COMMUNITY MODE</div>
          <h2 class="text-base sm:text-lg font-black text-[#151c75]">Creator Member</h2>
          <p class="text-[10px] sm:text-xs text-slate-500 mt-1">Panel ini khusus Creator yang bukan dibuat/dikelola Admin. Creator managed Studihome dikelola dari <b>Dapur</b>.</p>
        </div>
        <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-2xs w-full xl:w-80">
          <i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i>
          <input id="admin-creator-scope-search" type="search" placeholder="Cari Creator…" class="w-full bg-transparent text-xs outline-none" oninput="window.AdminCreatorScope.filter(this.value)">
        </div>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <div class="card-3d-inset rounded-xl p-3"><div class="text-[9px] text-slate-500">Creator Member</div><div class="text-lg font-black text-[#151c75]">${rows.length}</div></div>
        <div class="card-3d-inset rounded-xl p-3"><div class="text-[9px] text-slate-500">Published</div><div class="text-lg font-black text-emerald-600">${rows.filter(x=>x.is_published).length}</div></div>
        <div class="card-3d-inset rounded-xl p-3"><div class="text-[9px] text-slate-500">Verified</div><div class="text-lg font-black text-blue-700">${rows.filter(x=>x.is_verified).length}</div></div>
      </div>
      <div id="admin-creator-scope-list" class="space-y-2">${rows.length?rows.map(renderCard).join(''):'<div class="card-3d-inset rounded-2xl p-8 text-center text-xs text-slate-500">Belum ada Creator Member di luar katalog managed Studihome.</div>'}</div>
    </div>`;
  }catch(e){area.innerHTML=`<div class="card-3d p-5 rounded-2xl text-xs text-red-600">${esc(e.message||'Panel Creator belum bisa dimuat.')}</div>`;}
}

function filter(q){
  const s=String(q||'').trim().toLowerCase();
  document.querySelectorAll('#admin-creator-scope-list .admin-external-creator').forEach(el=>{el.style.display=!s||(el.dataset.search||'').includes(s)?'':'none';});
}
function openGovernance(id){ toast('Creator Member berada di scope Governance. Creator managed Studihome dikelola melalui Dapur.','info'); }
function ensure(){
  if(!isAdmin()||!supa())return;
  const creatorBtn=findTab('Creator');
  if(!creatorBtn||creatorBtn.dataset.scopeEnhanced==='1')return;
  creatorBtn.dataset.scopeEnhanced='1';
  creatorBtn.addEventListener('click',()=>setTimeout(render,0));
  if(String(location.hash||'').toLowerCase().includes('creator'))setTimeout(render,50);
}
window.AdminCreatorScope={render,filter,openGovernance,ensure};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
new MutationObserver(()=>ensure()).observe(document.body,{childList:true,subtree:true});
})();