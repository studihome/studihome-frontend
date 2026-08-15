(() => {
  'use strict';

  const isAdmin = () => (location.pathname || '/').replace(/\/+$/, '') === '/admin';
  const safe = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  function findNative(key) {
    return [...document.querySelectorAll('#admin-content-area button[onclick*=\"switchTab\"],button[onclick*=\"switchTab\"]')].find(btn => String(btn.getAttribute('onclick') || '').includes(`'${key}'`)) || null;
  }

  function openNative(key) {
    const native = findNative(key);
    if (native) {
      native.click();
      return true;
    }
    try {
      if (typeof window.App?.admin?.switchTab === 'function') {
        window.App.admin.switchTab(key);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function open() {
    if (!isAdmin()) return;
    const area = document.getElementById('admin-content-area');
    if (!area) return;
    area.innerHTML = `
      <div id="admin-gudang-v2" class="space-y-5">
        <div class="card-3d rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-white to-blue-50/70 border-blue-100">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">GUDANG · ADMIN CONTROL CENTER</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Satu pintu untuk Studio AI & Governance</h2><p class="mt-1 max-w-2xl text-[10px] sm:text-xs text-slate-500 leading-relaxed">Gudang tidak menduplikasi workspace. Tombol di bawah membuka modul native yang sudah ada di sistem.</p></div>
          </div>
        </div>
        <div class="grid xl:grid-cols-2 gap-4">
          <section class="card-3d rounded-3xl p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-start gap-3 min-w-0"><div class="w-11 h-11 rounded-2xl bg-blue-50 text-[#151c75] flex items-center justify-center shrink-0"><i class="fa-solid fa-wand-magic-sparkles"></i></div><div><h3 class="text-sm font-black text-[#151c75]">Studio AI</h3><p class="mt-1 text-[10px] text-slate-500 leading-relaxed">Katalog AI, kategori dan workspace AI.</p></div></div><button type="button" data-open="studio-ai" class="btn-brand-gradient px-3 py-2 rounded-xl text-[10px] font-extrabold shrink-0">Buka Studio AI</button></div></section>
          <section class="card-3d rounded-3xl p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-start gap-3 min-w-0"><div class="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-shield-halved"></i></div><div><h3 class="text-sm font-black text-[#151c75]">Governance</h3><p class="mt-1 text-[10px] text-slate-500 leading-relaxed">Review, policy, monitoring dan kontrol.</p></div></div><button type="button" data-open="governance" class="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-[10px] font-extrabold shrink-0">Buka Governance</button></div></section>
        </div>
        <div id="admin-gudang-v2-status" class="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-[10px] text-slate-500">Siap. Pilih workspace di atas.</div>
      </div>`;
    area.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.open;
      const ok = openNative(key);
      const status = document.getElementById('admin-gudang-v2-status');
      if (status) status.textContent = ok ? `Membuka ${key === 'studio-ai' ? 'Studio AI' : 'Governance'}…` : `Modul ${key} belum tersedia pada runtime Admin saat ini.`;
      if (!ok) toast(`Modul ${key === 'studio-ai' ? 'Studio AI' : 'Governance'} belum tersedia.`, 'error');
    }));
  }

  window.StudihomeGudangV2 = { open };
})();
