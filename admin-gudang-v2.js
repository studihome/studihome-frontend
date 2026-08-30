(() => {
  'use strict';

  const isAdminRoute = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const db = () => window.supabaseClient && typeof window.supabaseClient.from === 'function' ? window.supabaseClient : null;
  const esc = (v) => window.App?.utils?.escapeHtml
    ? window.App.utils.escapeHtml(v)
    : String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  async function requireAdmin() {
    const client = db();
    if (!client) throw new Error('Koneksi Supabase belum siap.');
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    if (!data?.user) throw new Error('Sesi Admin belum siap.');
    return client;
  }

  const openAdminTab = (key) => {
    try { if (typeof window.App?.admin?.switchTab === 'function') { window.App.admin.switchTab(key); return true; } } catch (_) {}
    return false;
  };

  const fmt = (n) => Number(n || 0).toLocaleString('id-ID');

  async function studioData() {
    const client = await requireAdmin();
    const [cats, links, creators, services] = await Promise.all([
      client.from('ai_categories').select('id,name,slug,description,icon,is_active,updated_at').order('name', { ascending: true }),
      client.from('ai_links').select('id,name,icon,sort_order,created_at').order('sort_order', { ascending: true }).order('name', { ascending: true }),
      client.from('creator_profiles').select('id').eq('is_published', true),
      client.from('creator_services').select('id').eq('is_active', true)
    ]);
    for (const r of [cats, links, creators, services]) if (r.error) throw r.error;
    return { categories: cats.data || [], links: links.data || [], creators: creators.data || [], services: services.data || [] };
  }

  async function governanceData() {
    const client = await requireAdmin();
    const [pendingCreators, orders, entitlements, profiles] = await Promise.all([
      client.from('creator_profiles').select('id,display_name,username,is_published,is_verified,review_status,managed_by_studihome,updated_at').in('review_status', ['PENDING','DRAFT']).order('updated_at', { ascending: false }).limit(12),
      client.from('orders').select('id,user_id,product_id,total_amount,status,payment_status,created_at').in('status', ['PAYMENT_REVIEW','PENDING_PAYMENT']).order('created_at', { ascending: false }).limit(12),
      client.from('entitlements').select('id,user_id,product_id,status,granted_at').order('granted_at', { ascending: false }).limit(500),
      client.from('profiles').select('id,name,email,role,status,created_at').order('created_at', { ascending: false }).limit(100)
    ]);
    for (const r of [pendingCreators, orders, entitlements, profiles]) if (r.error) throw r.error;
    return { pendingCreators: pendingCreators.data || [], orders: orders.data || [], entitlements: entitlements.data || [], profiles: profiles.data || [] };
  }

  async function toggleCategory(id, nextValue) {
    const client = await requireAdmin();
    const { error } = await client.from('ai_categories').update({ is_active: nextValue }).eq('id', id);
    if (error) throw error;
  }

  const decodeCategoryValue = (value) => {
    try { return decodeURIComponent(value || ''); } catch (_) { return ''; }
  };

  function editCategory(form, button) {
    if (!form || !button) return;
    form.querySelector('#admin-cat-id').value = button.dataset.categoryId || '';
    form.querySelector('[name=name]').value = decodeCategoryValue(button.dataset.categoryName);
    form.querySelector('[name=slug]').value = decodeCategoryValue(button.dataset.categorySlug);
    form.querySelector('[name=description]').value = decodeCategoryValue(button.dataset.categoryDescription);
    const submit = form.querySelector('#admin-cat-submit-btn');
    if (submit) {
      submit.textContent = 'Simpan Perubahan';
      submit.dataset.editing = 'true';
    }
    form.querySelector('[name=name]')?.focus();
  }

  function resetCategoryForm(form) {
    form?.reset();
    const id = form?.querySelector('#admin-cat-id');
    if (id) id.value = '';
    const submit = form?.querySelector('#admin-cat-submit-btn');
    if (submit) {
      submit.textContent = '+ Tambah Kategori';
      delete submit.dataset.editing;
    }
  }

  async function saveCategory(form) {
    const client = await requireAdmin();
    const id = String(form.querySelector('#admin-cat-id')?.value || '').trim();
    const name = String(form.querySelector('[name=name]').value || '').trim();
    const slug = String(form.querySelector('[name=slug]').value || '').trim().toLowerCase();
    const description = String(form.querySelector('[name=description]').value || '').trim();
    if (!name || !slug) throw new Error('Nama dan slug kategori wajib diisi.');
    const request = id
      ? client.from('ai_categories').update({ name, slug, description }).eq('id', id)
      : client.from('ai_categories').insert({ name, slug, description, is_active: true });
    const { error } = await request;
    if (error) throw error;
    toast(id ? 'Kategori AI diperbarui.' : 'Kategori AI ditambahkan.', 'success');
    resetCategoryForm(form);
  }

  async function addAiLink(form) {
    const client = await requireAdmin();
    const name = String(form.querySelector('[name=name]').value || '').trim();
    const icon = String(form.querySelector('[name=icon]').value || '').trim();
    const sortOrder = Number(form.querySelector('[name=sort_order]').value || 0);
    if (!name) throw new Error('Nama platform AI wajib diisi.');
    const { error } = await client.from('ai_links').insert({ name, icon, sort_order: Number.isFinite(sortOrder) ? sortOrder : 0 });
    if (error) throw error;
    toast('Platform AI ditambahkan.', 'success');
    form.reset();
  }

  async function deleteAiLink(id) {
    const client = await requireAdmin();
    if (!confirm('Hapus platform AI ini dari katalog?')) return;
    const { error } = await client.from('ai_links').delete().eq('id', id);
    if (error) throw error;
    toast('Platform AI dihapus.', 'success');
  }

  async function patchCreator(id, patch) {
    const client = await requireAdmin();
    const { data: userData } = await client.auth.getUser();
    const reviewer = userData?.user?.id || null;
    const payload = { ...patch };
    if (patch.review_status) {
      payload.reviewed_by = reviewer;
      payload.reviewed_at = new Date().toISOString();
    }
    const { error } = await client.from('creator_profiles').update(payload).eq('id', id);
    if (error) throw error;
  }

  async function patchProfile(id, status) {
    const client = await requireAdmin();
    const { error } = await client.from('profiles').update({ status }).eq('id', id);
    if (error) throw error;
  }

  function studioView(data) {
    return `
      <div class="space-y-5">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${[
            ['Kategori AI', data.categories.length, 'fa-layer-group', 'blue'],
            ['Platform AI', data.links.length, 'fa-link', 'amber'],
            ['Creator aktif', data.creators.length, 'fa-user-astronaut', 'blue'],
            ['Hidangan aktif', data.services.length, 'fa-bowl-food', 'amber']
          ].map(([label,val,icon,tone]) => `<div class="rounded-2xl border ${tone==='amber'?'border-amber-100':'border-blue-100'} bg-white p-4 shadow-sm"><div class="flex items-center justify-between gap-2"><span class="text-[9px] font-bold text-slate-500">${label}</span><i class="fa-solid ${icon} text-[11px] ${tone==='amber'?'text-amber-600':'text-[#151c75]'}"></i></div><div class="mt-1.5 text-xl font-black text-[#151c75]">${fmt(val)}</div></div>`).join('')}
        </div>

        <div class="grid xl:grid-cols-2 gap-4">
          <section class="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3 mb-3"><div><div class="text-[9px] font-black uppercase tracking-[.1em] text-blue-600">KATALOG</div><h3 class="text-sm font-black text-[#151c75]">Kategori AI</h3></div><button data-g-action="refresh" class="px-3 py-2 rounded-xl bg-blue-50 text-[#151c75] text-[10px] font-bold">Refresh</button></div>
            <form data-g-form="category" class="grid sm:grid-cols-3 gap-2 mb-3"><input type="hidden" id="admin-cat-id" value=""><input name="name" placeholder="Nama kategori" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="slug" placeholder="slug" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="description" placeholder="Deskripsi singkat" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><button id="admin-cat-submit-btn" class="sm:col-span-3 btn-brand-gradient rounded-xl px-3 py-2 text-[10px] font-extrabold">+ Tambah Kategori</button></form>
            <div class="space-y-2 max-h-[420px] overflow-auto pr-1">${data.categories.map(c => `<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(c.name)}</div><div class="text-[9px] text-slate-400 truncate">${esc(c.slug)} · ${c.is_active ? 'Aktif' : 'Nonaktif'}</div></div><div class="flex items-center gap-2 shrink-0"><button data-toggle-cat="${c.id}" data-next="${c.is_active ? 'false' : 'true'}" class="px-2.5 py-1.5 rounded-lg ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'} text-[9px] font-bold">${c.is_active ? 'Aktif' : 'Aktifkan'}</button><button type="button" data-edit-category="${esc(c.id)}" data-category-id="${esc(c.id)}" data-category-name="${encodeURIComponent(String(c.name || ''))}" data-category-slug="${encodeURIComponent(String(c.slug || ''))}" data-category-description="${encodeURIComponent(String(c.description || ''))}" class="w-7 h-7 rounded-lg bg-blue-50 text-[#151c75] hover:bg-blue-100 flex items-center justify-center transition-all" title="Edit Kategori" aria-label="Edit kategori ${esc(c.name)}"><i class="fa-solid fa-pen text-[10px]" aria-hidden="true"></i></button></div></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada kategori.</div>'}</div>
          </section>

          <section class="rounded-3xl border border-amber-100 bg-white p-4 sm:p-5 shadow-sm">
            <div class="mb-3"><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">INTEGRASI</div><h3 class="text-sm font-black text-[#151c75]">Platform AI</h3><p class="text-[9px] text-slate-500 mt-1">Atur nama, ikon, dan urutan platform yang ditampilkan.</p></div>
            <form data-g-form="link" class="grid sm:grid-cols-3 gap-2 mb-3"><input name="name" placeholder="Nama platform" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="icon" placeholder="fa-solid fa-bolt" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><input name="sort_order" type="number" value="0" placeholder="Urutan" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none"><button class="sm:col-span-3 bg-amber-50 text-amber-800 border border-amber-100 rounded-xl px-3 py-2 text-[10px] font-extrabold">+ Tambah Platform</button></form>
            <div class="space-y-2 max-h-[420px] overflow-auto pr-1">${data.links.map(l => `<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate"><i class="${esc(l.icon || 'fa-solid fa-link')} mr-1 text-amber-600"></i>${esc(l.name)}</div><div class="text-[9px] text-slate-400">Urutan ${fmt(l.sort_order)}</div></div><button data-delete-link="${l.id}" class="shrink-0 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 text-[9px] font-bold">Hapus</button></div>`).join('') || '<div class="text-[10px] text-slate-400">Belum ada platform AI.</div>'}</div>
          </section>
        </div>

        <div class="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-[10px] text-slate-600 leading-relaxed"><b class="text-[#151c75]">Logic Studio AI:</b> katalog AI dan kategorinya menjadi master data yang dipakai halaman Studio AI. Perubahan di sini langsung memengaruhi data yang dibaca frontend publik setelah refresh.</div>
      </div>`;
  }

  function governanceView(data) {
    const pending = data.pendingCreators.filter(c => c.review_status === 'PENDING').length;
    const draft = data.pendingCreators.filter(c => c.review_status === 'DRAFT').length;
    const reviewingOrders = data.orders.filter(o => o.status === 'PAYMENT_REVIEW' || o.payment_status === 'REVIEWING').length;
    const activeEnt = data.entitlements.filter(e => e.status === 'ACTIVE').length;
    const blocked = data.profiles.filter(p => p.status === 'blocked').length;

    return `
      <div class="space-y-5">
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
          ${[['Review Creator',pending,'fa-user-check','blue'],['Draft Creator',draft,'fa-pen','slate'],['Review Transaksi',reviewingOrders,'fa-receipt','amber'],['Akses Aktif',activeEnt,'fa-key','emerald'],['User Diblokir',blocked,'fa-user-lock','red']].map(([l,v,i,t])=>`<div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"><div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500">${l}</span><i class="fa-solid ${i} text-[11px] text-${t==='blue'?'blue-700':t==='amber'?'amber-600':t==='emerald'?'emerald-600':t==='red'?'red-600':'slate-600'}"></i></div><div class="mt-1.5 text-xl font-black text-[#151c75]">${fmt(v)}</div></div>`).join('')}
        </div>

        <div class="grid xl:grid-cols-2 gap-4">
          <section class="rounded-3xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
            <div class="flex items-center justify-between gap-3 mb-3"><div><div class="text-[9px] font-black uppercase tracking-[.1em] text-blue-600">REVIEW CREATOR</div><h3 class="text-sm font-black text-[#151c75]">Antrian Creator</h3></div><button data-g-action="refresh" class="px-3 py-2 rounded-xl bg-blue-50 text-[#151c75] text-[10px] font-bold">Refresh</button></div>
            <div class="space-y-2 max-h-[420px] overflow-auto pr-1">${data.pendingCreators.map(c=>`<div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(c.display_name || c.username)}</div><div class="text-[9px] text-slate-400">@${esc(c.username)} · ${esc(c.review_status)} · ${c.is_verified ? 'Verified' : 'Belum Verified'}</div></div><div class="flex gap-1.5 shrink-0"><button data-verify-creator="${c.id}" class="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-bold">Verifikasi</button><button data-publish-creator="${c.id}" class="px-2.5 py-1.5 rounded-lg bg-[#151c75] text-white text-[9px] font-bold">Publish</button></div></div></div>`).join('') || '<div class="text-[10px] text-slate-400">Tidak ada antrian Creator.</div>'}</div>
          </section>

          <section class="rounded-3xl border border-amber-100 bg-white p-4 sm:p-5 shadow-sm">
            <div class="mb-3"><div class="text-[9px] font-black uppercase tracking-[.1em] text-amber-600">TRANSAKSI & AKSES</div><h3 class="text-sm font-black text-[#151c75]">Kesehatan Operasional</h3></div>
            <div class="space-y-2 max-h-[420px] overflow-auto pr-1">${data.orders.map(o=>`<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(o.id)}</div><div class="text-[9px] text-slate-400">${esc(o.status)} · ${esc(o.payment_status)}</div></div><span class="text-[9px] font-black text-[#151c75]">Rp ${fmt(o.total_amount)}</span></div>`).join('') || '<div class="text-[10px] text-slate-400">Tidak ada transaksi yang perlu ditinjau.</div>'}</div>
            <button data-open-orders class="mt-3 w-full rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold py-2.5">Buka Transaksi</button>
          </section>
        </div>

        <section class="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"><div><div class="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">AKSES PENGGUNA</div><h3 class="text-sm font-black text-[#151c75]">Kontrol Status Akun</h3></div><span class="text-[9px] text-slate-400">${fmt(data.profiles.length)} akun terbaca</span></div>
          <div class="grid md:grid-cols-2 gap-2 max-h-[360px] overflow-auto pr-1">${data.profiles.slice(0,40).map(p=>`<div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"><div class="min-w-0"><div class="text-[10px] font-extrabold text-slate-700 truncate">${esc(p.name || p.email || 'Pengguna')}</div><div class="text-[9px] text-slate-400">${esc(p.email || '-')} · ${esc(p.role)} · ${esc(p.status)}</div></div><button data-toggle-user="${p.id}" data-next-status="${p.status === 'blocked' ? 'active' : 'blocked'}" class="shrink-0 px-2.5 py-1.5 rounded-lg ${p.status === 'blocked' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} text-[9px] font-bold">${p.status === 'blocked' ? 'Aktifkan' : 'Blokir'}</button></div>`).join('')}</div>
        </section>

        <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-[10px] text-slate-600 leading-relaxed"><b class="text-[#151c75]">Logic Governance:</b> menjaga kesehatan Creator, transaksi, entitlement, dan status pengguna dalam satu layar. Governance tidak mengambil alih fungsi Dapur Creator; ia mengawasi status dan melakukan tindakan kontrol yang terukur.</div>
      </div>`;
  }

  async function renderStudio(area) {
    area.innerHTML = '<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Studio AI…</div>';
    try { area.innerHTML = `<div id="g-workspace-title"></div>${studioView(await studioData())}`; bindStudio(area); }
    catch (e) { area.innerHTML = `<div class="rounded-2xl bg-red-50 border border-red-100 p-5 text-xs text-red-700">Studio AI gagal dimuat: ${esc(e.message || 'Unknown error')}</div>`; }
  }

  async function renderGovernance(area) {
    area.innerHTML = '<div class="py-12 text-center text-xs text-slate-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Memuat Governance…</div>';
    try { area.innerHTML = `<div id="g-workspace-title"></div>${governanceView(await governanceData())}`; bindGovernance(area); }
    catch (e) { area.innerHTML = `<div class="rounded-2xl bg-red-50 border border-red-100 p-5 text-xs text-red-700">Governance gagal dimuat: ${esc(e.message || 'Unknown error')}</div>`; }
  }

  function bindStudio(area) {
    area.querySelectorAll('[data-toggle-cat]').forEach(b => b.onclick = async () => { try { await toggleCategory(b.dataset.toggleCat, b.dataset.next === 'true'); await renderStudio(area); toast('Status kategori diperbarui.', 'success'); } catch (e) { toast(e.message || 'Kategori gagal diubah.', 'error'); } });
    const categoryForm = area.querySelector('[data-g-form="category"]');
    area.querySelectorAll('[data-edit-category]').forEach(button => button.onclick = () => editCategory(categoryForm, button));
    area.querySelectorAll('[data-delete-link]').forEach(b => b.onclick = async () => { try { await deleteAiLink(b.dataset.deleteLink); await renderStudio(area); } catch (e) { toast(e.message || 'Platform gagal dihapus.', 'error'); } });
    categoryForm?.addEventListener('submit', async e => { e.preventDefault(); try { await saveCategory(e.currentTarget); await renderStudio(area); } catch (err) { toast(err.message || 'Kategori gagal disimpan.', 'error'); } });
    area.querySelector('[data-g-form="link"]')?.addEventListener('submit', async e => { e.preventDefault(); try { await addAiLink(e.currentTarget); await renderStudio(area); } catch (err) { toast(err.message || 'Platform gagal ditambahkan.', 'error'); } });
    area.querySelectorAll('[data-g-action="refresh"]').forEach(b => b.onclick = () => renderStudio(area));
  }

  function bindGovernance(area) {
    area.querySelectorAll('[data-verify-creator]').forEach(b => b.onclick = async () => { try { await patchCreator(b.dataset.verifyCreator, { is_verified: true, review_status: 'APPROVED' }); await renderGovernance(area); toast('Creator diverifikasi.', 'success'); } catch (e) { toast(e.message || 'Verifikasi gagal.', 'error'); } });
    area.querySelectorAll('[data-publish-creator]').forEach(b => b.onclick = async () => { try { await patchCreator(b.dataset.publishCreator, { is_published: true, is_verified: true, review_status: 'APPROVED' }); await renderGovernance(area); toast('Creator dipublikasikan.', 'success'); } catch (e) { toast(e.message || 'Publish gagal.', 'error'); } });
    area.querySelectorAll('[data-toggle-user]').forEach(b => b.onclick = async () => { try { await patchProfile(b.dataset.toggleUser, b.dataset.nextStatus); await renderGovernance(area); toast('Status akun diperbarui.', 'success'); } catch (e) { toast(e.message || 'Status akun gagal diubah.', 'error'); } });
    area.querySelector('[data-open-orders]')?.addEventListener('click', () => { if (!openAdminTab('orders')) toast('Modul Transaksi belum tersedia pada Admin.', 'error'); });
    area.querySelectorAll('[data-g-action="refresh"]').forEach(b => b.onclick = () => renderGovernance(area));
  }

  function shell() {
    return `
      <section id="admin-gudang-v2" class="space-y-5 sm:space-y-6">
        <div class="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 sm:p-6 shadow-sm">
          <div class="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-200/40 blur-3xl"></div>
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div class="max-w-3xl"><div class="text-[9px] font-black uppercase tracking-[.14em] text-amber-600">GUDANG · ADMIN CONTROL CENTER</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Studio AI + Governance, satu pintu</h2><p class="mt-1.5 text-[10px] sm:text-xs text-slate-600 leading-relaxed">Pilih ruang kerja sesuai tujuan. Studio AI mengelola master AI; Governance menjaga kesehatan ekosistem dan tindakan kontrol.</p></div>
            <div class="flex flex-col items-stretch lg:items-end gap-3">
              <button type="button" onclick="if(window.App && window.App.sitemapBuilder) { window.App.sitemapBuilder.generateAndDownload(); } else { alert('Sitemap Builder belum termuat. Silakan refresh halaman.'); }" class="inline-flex items-center justify-center gap-2 bg-[#151c75] hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md lg:ml-auto">
                <i class="fa-solid fa-file-code"></i> Unduh Sitemap XML
              </button>
              <div class="grid grid-cols-2 gap-2"><button data-g-open="studio-ai" class="rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left hover:border-blue-200"><div class="text-[9px] text-slate-400">MASTER DATA</div><div class="text-xs font-black text-[#151c75] mt-0.5">Studio AI</div><div class="text-[9px] text-slate-500 mt-1">Kategori & platform</div></button><button data-g-open="governance" class="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-left hover:border-amber-200"><div class="text-[9px] text-slate-400">CONTROL CENTER</div><div class="text-xs font-black text-[#151c75] mt-0.5">Governance</div><div class="text-[9px] text-slate-500 mt-1">Review & kontrol</div></button></div>
            </div>
          </div>
        </div>
        <div id="gudang-workspace-area"></div>
      </section>`;
  }

  async function open() {
    if (!isAdminRoute()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = shell();
    const workspace = area.querySelector('#gudang-workspace-area');
    const select = async key => key === 'studio-ai' ? renderStudio(workspace) : renderGovernance(workspace);
    area.querySelectorAll('[data-g-open]').forEach(b => b.addEventListener('click', () => select(b.dataset.gOpen)));
    await select('studio-ai');
  }

  window.StudihomeGudangV2 = Object.freeze({ open });
})();
