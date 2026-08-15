(() => {
  'use strict';
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');
  const supa = () => window.supabaseClient;
  const toast = (m,t='info') => window.App?.ui?.toast?.(m,t);
  const isAdmin = () => location.pathname === '/admin';

  function loadScript(src, dataKey) {
    if (document.querySelector(`script[data-${dataKey}]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.dataset[dataKey] = '1';
    s.defer = true;
    document.head.appendChild(s);
  }

  async function loadCreators() {
    const { data, error } = await supa().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,is_published,is_verified,review_status,updated_at,is_studihome_official,managed_by_studihome')
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function bundle(id) {
    const [services, portfolios, cats] = await Promise.all([
      supa().from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      supa().from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      supa().from('creator_category_members').select('creator_id,category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id)
    ]);
    if (services.error || portfolios.error || cats.error) throw services.error || portfolios.error || cats.error;
    return { services: services.data || [], portfolios: portfolios.data || [], categories: cats.data || [] };
  }

  function area() { return document.getElementById('admin-dapur-creator-content'); }

  function badge(c) {
    if (c.is_studihome_official) return '<span class="px-2 py-1 rounded-lg bg-amber-50 text-amber-700">✦ Official</span>';
    if (c.managed_by_studihome) return '<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75]">Managed</span>';
    return '<span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">Community</span>';
  }

  function card(c) {
    return `<details class="admin-dc-item card-3d rounded-2xl bg-white overflow-hidden" data-type="${c.managed_by_studihome ? 'managed':'community'}" data-published="${c.is_published?'1':'0'}" data-search="${esc(`${c.display_name||''} ${c.username||''} ${c.bio||''} ${c.location||''}`).toLowerCase()}">
      <summary class="list-none cursor-pointer p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">${c.avatar_url ? `<img src="${esc(c.avatar_url)}" alt="" class="w-full h-full object-contain bg-white">` : `<span class="font-black text-[#151c75]">${esc(String(c.display_name||'C').charAt(0).toUpperCase())}</span>`}</div>
          <div class="min-w-0"><div class="text-xs sm:text-sm font-extrabold text-[#151c75] truncate flex items-center gap-1.5">${esc(c.display_name||c.username)} ${c.is_studihome_official?'<span class="text-amber-500">✦</span>':''}</div><div class="text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5">@${esc(c.username)} · ${c.is_published?'Published':'Draft'} · ${c.is_verified?'Verified':'Belum verified'}</div></div>
        </div>
        <div class="flex items-center gap-2 shrink-0">${badge(c)}<i class="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i></div>
      </summary>
      <div class="border-t border-slate-100 p-4" data-creator-id="${c.id}"><div class="py-5 text-center text-[10px] text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-1"></i> Menyiapkan workspace…</div></div>
    </details>`;
  }

  async function renderDetail(host,id) {
    try {
      const { data: creator, error } = await supa().from('creator_profiles').select('*').eq('id',id).maybeSingle();
      if (error) throw error;
      if (!creator) throw new Error('Creator tidak ditemukan.');
      const b = await bundle(id);
      host.dataset.loaded='1';
      host.innerHTML = `<div class="space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div><div class="text-[9px] font-black uppercase tracking-wider text-amber-600">Workspace Creator</div><div class="text-sm font-black text-[#151c75] mt-0.5">${esc(creator.display_name||creator.username)}</div><div class="text-[9px] text-slate-500 mt-0.5">${creator.managed_by_studihome?'Creator dikelola Studihome':'Creator komunitas/member'}</div></div>
          <div class="flex flex-wrap gap-2"><button class="px-3 py-2 rounded-xl text-[10px] font-bold ${creator.is_verified?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}" onclick="window.AdminDapurCreator.toggleVerified('${id}',${!creator.is_verified})">${creator.is_verified?'Cabut Verified':'Verifikasi'}</button><button class="px-3 py-2 rounded-xl text-[10px] font-bold ${creator.is_published?'bg-red-50 text-red-700':'btn-brand-gradient'}" onclick="window.AdminDapurCreator.togglePublished('${id}',${!creator.is_published})">${creator.is_published?'Tarik Publish':'Publish'}</button><a href="/${encodeURIComponent(creator.username)}" target="_blank" rel="noopener" class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-bold text-[#151c75]">Lihat Profil</a></div>
        </div>
        <div class="grid xl:grid-cols-2 gap-4">
          <section class="card-3d-inset rounded-2xl p-4 space-y-3"><div class="flex items-center justify-between"><div class="text-xs font-black text-[#151c75]">Foyer</div><button class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapurCreator.editProfile('${id}')">Edit Profil</button></div><div class="grid sm:grid-cols-2 gap-2 text-[10px]"><span class="text-slate-500">Nama</span><b class="text-right">${esc(creator.display_name||'-')}</b><span class="text-slate-500">Username</span><b class="text-right">@${esc(creator.username||'-')}</b><span class="text-slate-500">Lokasi</span><b class="text-right">${esc(creator.location||'-')}</b></div></section>
          <section class="card-3d-inset rounded-2xl p-4"><div class="flex items-center justify-between mb-2"><div class="text-xs font-black text-[#151c75]">Menu</div><button class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapurCreator.editCategories('${id}')">Kelola</button></div><div class="flex flex-wrap gap-1.5">${b.categories.length?b.categories.map(x=>`<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-bold">${esc(x.ai_categories?.name||x.category_id)}${x.is_primary?' · utama':''}</span>`).join(''):'<span class="text-[10px] text-slate-400">Belum ada kategori.</span>'}</div></section>
          <section class="card-3d-inset rounded-2xl p-4 xl:col-span-2"><div class="flex items-center justify-between mb-3"><div><div class="text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500">${b.services.length} jasa</div></div><button class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapurCreator.addService('${id}')">+ Tambah</button></div><div class="grid md:grid-cols-2 gap-2">${b.services.map(s=>`<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(s.title)}</div><div class="text-[9px] text-slate-500 mt-1 line-clamp-2">${esc(s.description)}</div></div><button class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapurCreator.editService('${s.id}')">Edit</button></div><div class="text-[9px] mt-2 font-bold text-slate-500">Rp ${Number(s.price_from||0).toLocaleString('id-ID')} – Rp ${Number(s.price_to||0).toLocaleString('id-ID')} · ${s.delivery_days||0} hari</div></div>`).join('')||'<div class="text-[10px] text-slate-400">Belum ada jasa.</div>'}</div></section>
          <section class="card-3d-inset rounded-2xl p-4 xl:col-span-2"><div class="flex items-center justify-between mb-3"><div><div class="text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500">${b.portfolios.length} portfolio</div></div><button class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapurCreator.addPortfolio('${id}')">+ Tambah</button></div><div class="grid md:grid-cols-2 gap-2">${b.portfolios.map(p=>`<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(p.title)}</div><div class="text-[9px] text-slate-500 mt-1">${esc(p.media_type)}</div></div><button class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapurCreator.editPortfolio('${p.id}')">Edit</button></div><a href="${esc(p.media_url)}" target="_blank" rel="noopener noreferrer" class="block mt-2 text-[9px] text-blue-700 truncate">${esc(p.media_url)}</a></div>`).join('')||'<div class="text-[10px] text-slate-400">Belum ada portfolio.</div>'}</div></section>
        </div>
      </div>`;
    } catch(e) { host.innerHTML=`<div class="text-xs text-red-600">${esc(e.message||'Detail Creator gagal dimuat.')}</div>`; }
  }

  async function updateCreator(id, patch) { const { error } = await supa().from('creator_profiles').update(patch).eq('id',id); if(error) throw error; }
  async function toggleVerified(id,v){try{await updateCreator(id,{is_verified:v});toast(v?'Creator diverifikasi.':'Verified dicabut.','success');await render();}catch(e){toast(e.message||'Gagal mengubah verification.','error');}}
  async function togglePublished(id,v){try{await updateCreator(id,{is_published:v,review_status:v?'APPROVED':'DRAFT'});toast(v?'Creator dipublikasikan.':'Creator ditarik dari publik.','success');await render();}catch(e){toast(e.message||'Gagal mengubah publish.','error');}}
  async function editProfile(id){const {data:c,error}=await supa().from('creator_profiles').select('*').eq('id',id).maybeSingle();if(error||!c){toast(error?.message||'Creator tidak ditemukan.','error');return;}const name=prompt('Nama tampilan Creator:',c.display_name||'');if(name===null)return;const bio=prompt('Bio Creator:',c.bio||'');if(bio===null)return;const wa=prompt('WhatsApp:',c.whatsapp||'');if(wa===null)return;const loc=prompt('Lokasi:',c.location||'');if(loc===null)return;try{await updateCreator(id,{display_name:name.trim(),bio:bio.trim(),whatsapp:wa.trim(),location:loc.trim()});toast('Foyer Creator diperbarui.','success');await render();}catch(e){toast(e.message||'Profil belum bisa diperbarui.','error');}}

  function filter(q){const s=String(q||'').trim().toLowerCase();document.querySelectorAll('#admin-dc-list .admin-dc-item').forEach(el=>{el.style.display=!s||(el.dataset.search||'').includes(s)?'':'none';});}
  function setFilter(kind){document.querySelectorAll('.admin-dc-filter').forEach(b=>{const on=b.dataset.filter===kind;b.classList.toggle('btn-brand-gradient',on);b.classList.toggle('bg-white',!on);b.classList.toggle('text-slate-700',!on);});document.querySelectorAll('#admin-dc-list .admin-dc-item').forEach(el=>{const show=kind==='all'||(kind===el.dataset.type)||(kind==='published'&&el.dataset.published==='1');el.style.display=show?'':'none';});}
  function collapseAll(){document.querySelectorAll('#admin-dc-list details').forEach(d=>d.open=false);}

  async function render(){
    if(!isAdmin()) return;
    loadScript('/admin-dapur-actions.js?v=2','studihomeAdminDapurActions');
    loadScript('/admin-dapur-theme.js?v=2','studihomeAdminDapurTheme');
    const root=area(); if(!root) return;
    root.innerHTML='<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Menyiapkan Dapur Creator…</div>';
    try{
      const rows=await loadCreators();
      const managed=rows.filter(c=>c.managed_by_studihome).length, community=rows.length-managed, published=rows.filter(c=>c.is_published).length, verified=rows.filter(c=>c.is_verified).length;
      root.innerHTML=`<div class="space-y-5">
        <div class="card-3d rounded-3xl p-4 sm:p-5 bg-gradient-to-br from-white to-blue-50/70 border-blue-100"><div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">DAPUR CREATOR · ADMIN</div><h2 class="text-lg sm:text-xl font-black text-[#151c75] mt-1">Kelola semua Creator dalam satu tempat</h2><p class="text-[10px] sm:text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">Satu workspace untuk Creator Managed Studihome dan Creator Community. Admin bisa mencari, mengisi, mengedit, memverifikasi, mempublikasikan, dan melihat profil tanpa berpindah panel.</p></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-2 min-w-0 xl:min-w-[420px]"><div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Total</div><div class="text-lg font-black text-[#151c75]">${rows.length}</div></div><div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Managed</div><div class="text-lg font-black text-[#151c75]">${managed}</div></div><div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Community</div><div class="text-lg font-black text-[#151c75]">${community}</div></div><div class="rounded-xl bg-white border border-blue-100 px-3 py-2.5"><div class="text-[9px] text-slate-500">Published</div><div class="text-lg font-black text-[#151c75]">${published}</div></div></div></div></div>
        <div class="card-3d-inset rounded-2xl p-3 flex flex-col lg:flex-row gap-2"><div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 flex-1"><i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i><input id="admin-dc-search" type="search" placeholder="Cari nama, username, bio, atau lokasi Creator…" class="w-full bg-transparent text-xs outline-none" oninput="window.AdminDapurCreator.filter(this.value)"></div><div class="flex flex-wrap gap-1.5"><button data-filter="all" class="admin-dc-filter px-3 py-2 rounded-xl text-[10px] font-extrabold btn-brand-gradient" onclick="window.AdminDapurCreator.setFilter('all')">Semua ${rows.length}</button><button data-filter="managed" class="admin-dc-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white text-slate-700 border border-slate-200" onclick="window.AdminDapurCreator.setFilter('managed')">Managed ${managed}</button><button data-filter="community" class="admin-dc-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white text-slate-700 border border-slate-200" onclick="window.AdminDapurCreator.setFilter('community')">Community ${community}</button><button data-filter="published" class="admin-dc-filter px-3 py-2 rounded-xl text-[10px] font-extrabold bg-white text-slate-700 border border-slate-200" onclick="window.AdminDapurCreator.setFilter('published')">Published ${published}</button></div></div>
        <div class="flex items-center justify-between px-1"><div class="text-[10px] text-slate-500"><b class="text-[#151c75]">${verified}</b> Creator terverifikasi</div><button class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapurCreator.collapseAll()">Tutup semua</button></div>
        <div id="admin-dc-list" class="space-y-2">${rows.length?rows.map(card).join(''):'<div class="card-3d-inset rounded-2xl p-8 text-center text-xs text-slate-500">Belum ada Creator.</div>'}</div>
      </div>`;
      root.querySelectorAll('details.admin-dc-item').forEach(d=>d.addEventListener('toggle',async()=>{if(!d.open)return;const host=d.querySelector('[data-creator-id]');if(!host||host.dataset.loaded==='1')return;await renderDetail(host,host.dataset.creatorId);}));
    }catch(e){root.innerHTML=`<div class="card-3d p-5 rounded-2xl text-xs text-red-600">${esc(e.message||'Dapur Creator Admin belum bisa dimuat.')}</div>`;}
  }

  function open(){const a=document.getElementById('admin-content-area');if(!a)return;a.innerHTML='<div id="admin-dapur-creator-content"></div>';render();}

  function ensureTab(){
    if(!isAdmin())return;
    const buttons=[...document.querySelectorAll('button[onclick*="switchTab"]')];
    const creator=buttons.find(b=>String(b.getAttribute('onclick')||'').includes("'creators'"));
    const studio=buttons.find(b=>String(b.getAttribute('onclick')||'').includes("'studio-ai'"));
    if(!creator)return;
    creator.id='admin-dapur-creator-tab-btn';
    creator.dataset.adminDapurCreator='1';
    creator.innerHTML='<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur Creator';
    creator.onclick=(e)=>{e.preventDefault();open();};
    if(studio&&creator.parentElement===studio.parentElement)creator.parentElement.insertBefore(creator,studio);
    document.querySelectorAll('[data-admin-dapur-nav="1"],#admin-dapur-tab-btn').forEach(el=>{if(el!==creator)el.remove();});
  }
  let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;ensureTab();});}
  function init(){if(!isAdmin())return;ensureTab();const mo=new MutationObserver(schedule);mo.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('popstate',schedule);window.addEventListener('hashchange',schedule);}

  window.AdminDapurCreator={render,open,filter,setFilter,collapseAll,toggleVerified,togglePublished,editProfile,editCategories(...a){return window.AdminDapur?.editCategories?.(...a)},addService(...a){return window.AdminDapur?.addService?.(...a)},editService(...a){return window.AdminDapur?.editService?.(...a)},addPortfolio(...a){return window.AdminDapur?.addPortfolio?.(...a)},editPortfolio(...a){return window.AdminDapur?.editPortfolio?.(...a)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
