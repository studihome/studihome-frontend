(() => {
  'use strict';

  const RESERVED = ['orders','products','modules','master','users','creators','studio-ai','governance','dapur'];
  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '');
  const supa = () => window.supabaseClient;
  const toast = (m,t='info') => window.App?.ui?.toast?.(m,t);
  const isAdminPage = () => (location.pathname || '/') === '/admin';

  async function loadManagedCreators() {
    const { data, error } = await supa().from('creator_profiles')
      .select('id,user_id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,is_published,is_verified,review_status,updated_at,is_studihome_official,managed_by_studihome')
      .eq('managed_by_studihome', true)
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function loadCreatorBundle(id) {
    const [services, portfolios, cats] = await Promise.all([
      supa().from('creator_services').select('*').eq('creator_id', id).order('created_at', { ascending: true }),
      supa().from('creator_portfolios').select('*').eq('creator_id', id).order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
      supa().from('creator_category_members').select('creator_id,category_id,is_primary,ai_categories(id,name,slug,icon)').eq('creator_id', id)
    ]);
    if (services.error) throw services.error;
    if (portfolios.error) throw portfolios.error;
    if (cats.error) throw cats.error;
    return { services: services.data || [], portfolios: portfolios.data || [], categories: cats.data || [] };
  }

  function panel() {
    return document.getElementById('admin-dapur-content');
  }

  async function render() {
    if (!isAdminPage()) return;
    const root = panel();
    if (!root) return;
    root.innerHTML = '<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Creator yang dikelola Studihome…</div>';
    try {
      const rows = await loadManagedCreators();
      root.innerHTML = `
        <div class="space-y-5">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">DAPUR · OPERATOR MODE</div>
              <h2 class="text-base sm:text-lg font-black text-[#151c75]">Creator yang Dikelola Studihome</h2>
              <p class="text-[10px] sm:text-xs text-slate-500 mt-1">Admin dapat mengelola Foyer, Menu, Hidangan, Ambalan, verifikasi, dan publikasi untuk semua Creator dengan status managed.</p>
            </div>
            <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-2xs w-full lg:w-80">
              <i class="fa-solid fa-magnifying-glass text-[#151c75] text-xs"></i>
              <input id="admin-dapur-search" type="search" placeholder="Cari Creator…" class="w-full bg-transparent text-xs outline-none" oninput="window.AdminDapur.filter(this.value)">
            </div>
          </div>
          <div id="admin-dapur-list" class="space-y-2">
            ${rows.length ? rows.map(c => `
              <details class="admin-dapur-item card-3d rounded-2xl bg-white overflow-hidden" data-search="${esc((c.display_name||'')+' '+(c.username||'')).toLowerCase()}">
                <summary class="list-none cursor-pointer p-3.5 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                      ${c.avatar_url ? `<img src="${esc(c.avatar_url)}" class="w-full h-full object-contain bg-white">` : `<span class="font-black text-[#151c75]">${esc(String(c.display_name||'C').charAt(0).toUpperCase())}</span>`}
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-extrabold text-[#151c75] truncate">${esc(c.display_name || c.username)} ${c.is_studihome_official ? '<span class="text-amber-500">✦</span>' : ''}</div>
                      <div class="text-[9px] text-slate-400 truncate">@${esc(c.username)} · ${c.is_published ? 'Published' : 'Draft'} · ${c.is_verified ? 'Verified' : 'Belum verified'}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0"><span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">Managed</span><i class="fa-solid fa-chevron-down text-slate-400 text-[10px]"></i></div>
                </summary>
                <div class="border-t border-slate-100 p-4" data-creator-id="${c.id}"><div class="py-5 text-center text-[10px] text-slate-400">Muat detail…</div></div>
              </details>
            `).join('') : '<div class="card-3d-inset rounded-2xl p-8 text-center text-xs text-slate-500">Belum ada Creator managed. Buat Creator dari mode operator untuk mulai mengisi katalog.</div>'}
          </div>
        </div>`;

      root.querySelectorAll('details[data-creator-id], details.admin-dapur-item').forEach(d => {
        d.addEventListener('toggle', async () => {
          if (!d.open) return;
          const host = d.querySelector('[data-creator-id]');
          if (!host || host.dataset.loaded === '1') return;
          await renderDetail(host, host.dataset.creatorId || d.querySelector('[data-creator-id]')?.getAttribute('data-creator-id'));
        });
      });
    } catch (e) {
      root.innerHTML = `<div class="card-3d p-5 rounded-2xl text-xs text-red-600">${esc(e.message || 'Dapur Admin belum bisa dimuat.')}</div>`;
    }
  }

  async function renderDetail(host, creatorId) {
    try {
      const { data: creator, error } = await supa().from('creator_profiles').select('*').eq('id', creatorId).maybeSingle();
      if (error) throw error;
      if (!creator) throw new Error('Creator tidak ditemukan.');
      const b = await loadCreatorBundle(creatorId);
      host.dataset.loaded = '1';
      host.innerHTML = `
        <div class="grid xl:grid-cols-2 gap-4">
          <section class="card-3d-inset rounded-2xl p-4 space-y-3">
            <div class="flex items-center justify-between gap-2"><div class="text-xs font-black text-[#151c75]">Foyer</div><button class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapur.editProfile('${creatorId}')">Edit Profil</button></div>
            <div class="grid sm:grid-cols-2 gap-2"><div class="text-[10px] text-slate-500">Nama</div><div class="text-xs font-bold text-right">${esc(creator.display_name)}</div><div class="text-[10px] text-slate-500">Username</div><div class="text-xs font-bold text-right">@${esc(creator.username)}</div><div class="text-[10px] text-slate-500">Status</div><div class="text-xs font-bold text-right">${creator.is_published ? 'Published' : 'Draft'} · ${creator.is_verified ? 'Verified' : 'Belum verified'}</div></div>
            <div class="flex flex-wrap gap-2"><button class="px-3 py-2 rounded-xl text-[10px] font-bold ${creator.is_verified?'bg-red-50 text-red-700':'bg-emerald-50 text-emerald-700'}" onclick="window.AdminDapur.toggleVerified('${creatorId}',${!creator.is_verified})">${creator.is_verified?'Cabut Verified':'Verifikasi'}</button><button class="px-3 py-2 rounded-xl text-[10px] font-bold ${creator.is_published?'bg-red-50 text-red-700':'btn-brand-gradient'}" onclick="window.AdminDapur.togglePublished('${creatorId}',${!creator.is_published})">${creator.is_published?'Tarik Publish':'Publish'}</button><a class="px-3 py-2 rounded-xl bg-white border border-blue-100 text-[10px] font-bold text-[#151c75]" href="/${encodeURIComponent(creator.username)}" target="_blank" rel="noopener">Lihat Profil</a></div>
          </section>
          <section class="card-3d-inset rounded-2xl p-4">
            <div class="flex items-center justify-between gap-2 mb-2"><div class="text-xs font-black text-[#151c75]">Menu</div><button class="text-[10px] font-bold text-[#151c75]" onclick="window.AdminDapur.editCategories('${creatorId}')">Kelola</button></div>
            <div class="flex flex-wrap gap-1.5">${b.categories.length ? b.categories.map(x=>`<span class="px-2 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-bold">${esc(x.ai_categories?.name || x.category_id)}${x.is_primary?' · utama':''}</span>`).join('') : '<span class="text-[10px] text-slate-400">Belum ada kategori.</span>'}</div>
          </section>
          <section class="card-3d-inset rounded-2xl p-4 xl:col-span-2">
            <div class="flex items-center justify-between gap-2 mb-3"><div><div class="text-xs font-black text-[#151c75]">Hidangan</div><div class="text-[9px] text-slate-500">${b.services.length} jasa</div></div><button class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapur.addService('${creatorId}')">+ Tambah</button></div>
            <div class="grid md:grid-cols-2 gap-2">${b.services.map(s=>`<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(s.title)}</div><div class="text-[9px] text-slate-500 mt-1 line-clamp-2">${esc(s.description)}</div></div><button class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapur.editService('${s.id}')">Edit</button></div><div class="text-[9px] mt-2 font-bold text-slate-500">Rp ${Number(s.price_from).toLocaleString('id-ID')} – Rp ${Number(s.price_to).toLocaleString('id-ID')} · ${s.delivery_days} hari</div></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada jasa.</div>'}</div>
          </section>
          <section class="card-3d-inset rounded-2xl p-4 xl:col-span-2">
            <div class="flex items-center justify-between gap-2 mb-3"><div><div class="text-xs font-black text-[#151c75]">Ambalan</div><div class="text-[9px] text-slate-500">${b.portfolios.length} portfolio</div></div><button class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-bold" onclick="window.AdminDapur.addPortfolio('${creatorId}')">+ Tambah</button></div>
            <div class="grid md:grid-cols-2 gap-2">${b.portfolios.map(p=>`<div class="bg-white border border-slate-100 rounded-xl p-3"><div class="flex items-start justify-between gap-2"><div><div class="text-xs font-bold text-[#151c75]">${esc(p.title)}</div><div class="text-[9px] text-slate-500 mt-1">${esc(p.media_type)}</div></div><button class="text-[9px] font-bold text-[#151c75]" onclick="window.AdminDapur.editPortfolio('${p.id}')">Edit</button></div><a href="${esc(p.media_url)}" target="_blank" rel="noopener noreferrer" class="block mt-2 text-[9px] text-blue-700 truncate">${esc(p.media_url)}</a></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada portfolio.</div>'}</div>
          </section>
        </div>`;
    } catch (e) { host.innerHTML = `<div class="text-xs text-red-600">${esc(e.message || 'Detail Creator gagal dimuat.')}</div>`; }
  }

  async function updateCreator(id, patch) {
    const { error } = await supa().from('creator_profiles').update(patch).eq('id', id).eq('managed_by_studihome', true);
    if (error) throw error;
  }

  async function toggleVerified(id, value) { try { await updateCreator(id,{is_verified:value}); toast(value?'Creator diverifikasi.':'Verified dicabut.','success'); await render(); } catch(e){toast(e.message||'Gagal mengubah verification.','error');} }
  async function togglePublished(id, value) { try { await updateCreator(id,{is_published:value, review_status:value?'APPROVED':'DRAFT'}); toast(value?'Creator dipublikasikan.':'Creator ditarik dari publik.','success'); await render(); } catch(e){toast(e.message||'Gagal mengubah publish.','error');} }

  async function editProfile(id) {
    const {data:c,error}=await supa().from('creator_profiles').select('*').eq('id',id).maybeSingle(); if(error||!c){toast(error?.message||'Creator tidak ditemukan.','error');return;}
    const name=prompt('Nama tampilan Creator:',c.display_name||''); if(name===null)return;
    const bio=prompt('Bio Creator:',c.bio||''); if(bio===null)return;
    const wa=prompt('WhatsApp:',c.whatsapp||''); if(wa===null)return;
    const loc=prompt('Lokasi:',c.location||''); if(loc===null)return;
    try{await updateCreator(id,{display_name:name.trim(),bio:bio.trim(),whatsapp:wa.trim(),location:loc.trim()});toast('Foyer Creator diperbarui.','success');await render();}catch(e){toast(e.message||'Profil belum bisa diperbarui.','error');}
  }

  function filter(q){const s=String(q||'').trim().toLowerCase();document.querySelectorAll('#admin-dapur-list .admin-dapur-item').forEach(el=>{el.style.display=!s||(el.dataset.search||'').includes(s)?'':'none';});}

  async function init(){
    if(!isAdminPage() || !supa()) return;
    const nav=[...document.querySelectorAll('#admin-content-area')];
    if(!nav.length) return;
    const tabbar=document.querySelector('#admin-content-area')?.parentElement;
    if(!tabbar) return;
    const buttons=[...document.querySelectorAll('button[onclick*="switchTab"]')];
    const creatorBtn=buttons.find(b=>String(b.getAttribute('onclick')).includes("'creators'"));
    if(!creatorBtn || document.getElementById('admin-dapur-tab-btn')) return;
    const btn=document.createElement('button');
    btn.id='admin-dapur-tab-btn'; btn.className=creatorBtn.className; btn.innerHTML='<i class="fa-solid fa-kitchen-set mr-1"></i> Dapur';
    btn.addEventListener('click',()=>{
      document.querySelectorAll('button[onclick*="switchTab"]').forEach(x=>x.classList.remove('btn-brand-gradient','shadow-xs'));
      btn.classList.add('btn-brand-gradient','shadow-xs');
      const area=document.getElementById('admin-content-area');
      area.innerHTML='<div id="admin-dapur-content"></div>';
      render();
    });
    creatorBtn.insertAdjacentElement('afterend',btn);
  }

  window.AdminDapur={init,render,filter,toggleVerified,togglePublished,editProfile};
  const boot=()=>{init();};
  window.addEventListener('DOMContentLoaded',boot);
  new MutationObserver(()=>init()).observe(document.documentElement,{childList:true,subtree:true});
})();
