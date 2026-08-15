(() => {
  'use strict';

  const RESERVED = new Set(['','/','/products','/kamar','/admin','/studio-ai','/dapur','/dapur/foyer','/dapur/menu','/dapur/hidangan','/dapur/ambalan','/ruang-kerja','/creator-studio','/dashboard','/ai-video','/ai-automation','/ai-content','/ai-untuk-guru','/ai-untuk-umkm']);
  let renderedFor = '';
  let modal;

  const esc = (v) => window.App?.utils?.escapeHtml ? window.App.utils.escapeHtml(v) : String(v ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));

  function creatorPath() {
    const path = (location.pathname || '/').replace(/\/+$/, '') || '/';
    if (RESERVED.has(path)) return null;
    const m = path.match(/^\/([a-z0-9][a-z0-9-]{2,39})(?:\/portfolio\/([a-z0-9][a-z0-9-]{0,120}))?$/i);
    return m ? { username: m[1].toLowerCase(), portfolioSlug: m[2] || null } : null;
  }

  function ytId(url) {
    try { const u = new URL(url); if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0]; return u.searchParams.get('v'); } catch (_) { return null; }
  }
  function drivePreview(url) {
    try { const u = new URL(url); const m = u.pathname.match(/\/file\/d\/([^/]+)/); return m ? `https://drive.google.com/file/d/${m[1]}/preview` : url; } catch (_) { return url; }
  }
  function mediaType(url) {
    let u; try { u = new URL(url); } catch (_) { return 'link'; }
    const host = u.hostname.toLowerCase(), path = u.pathname.toLowerCase();
    if ((host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be') && (u.searchParams.get('v') || host === 'youtu.be')) return 'youtube';
    if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host)) return 'drive';
    if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/\.(png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(path)) return 'image';
    if (/\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i.test(path)) return 'video';
    return 'link';
  }

  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'creator-media-modal';
    modal.className = 'fixed inset-0 z-[9999] hidden bg-slate-950/95';
    modal.innerHTML = `<div class="w-full h-full flex items-center justify-center p-2 sm:p-4"><button id="creator-media-close" class="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-blue-100 text-[#151c75] font-black shadow-lg">×</button><div id="creator-media-stage" class="w-full h-full flex items-center justify-center"></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#creator-media-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    return modal;
  }
  function closeModal() { if (!modal) return; modal.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); }
  function openMedia(item) {
    const m = ensureModal(); const stage = m.querySelector('#creator-media-stage');
    const type = mediaType(item.media_url); const url = String(item.media_url || '').trim();
    let html = '';
    if (type === 'image') html = `<img src="${esc(url)}" alt="${esc(item.title)}" class="max-w-full max-h-full object-contain rounded-xl" referrerpolicy="no-referrer">`;
    else if (type === 'video') html = `<video src="${esc(url)}" controls playsinline autoplay class="max-w-full max-h-full rounded-xl bg-black"></video>`;
    else if (type === 'youtube') { const id = ytId(url); html = id ? `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen class="w-full h-[72vh] rounded-xl bg-black"></iframe>` : `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="btn-brand-gradient px-4 py-3 rounded-xl font-bold">Buka YouTube</a>`; }
    else if (type === 'drive') html = `<iframe src="${esc(drivePreview(url))}" allow="autoplay" class="w-full h-[72vh] rounded-xl bg-black"></iframe>`;
    else html = `<div class="max-w-md text-center text-white"><div class="text-lg font-black mb-2">Buka media</div><p class="text-sm text-blue-100 mb-4">Platform ini dapat membatasi pemutaran langsung di dalam situs.</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="inline-flex btn-brand-gradient px-4 py-3 rounded-xl font-bold">Buka tautan asli</a></div>`;
    stage.innerHTML = html; m.classList.remove('hidden'); document.body.classList.add('overflow-hidden');
  }

  async function load() {
    const target = creatorPath();
    if (!target || target.portfolioSlug) return;
    if (renderedFor === target.username) return;
    if (!window.supabaseClient) return;
    const host = document.getElementById('main-content');
    if (!host) return;

    const { data: profile, error } = await window.supabaseClient.from('creator_profiles').select('id,username,display_name,bio,avatar_url,cover_url,whatsapp,location,is_published,is_verified,managed_by_studihome,is_studihome_official').eq('username', target.username).eq('is_published', true).maybeSingle();
    if (error || !profile) {
      host.innerHTML = `<div class="max-w-xl mx-auto mt-10 card-3d p-8 rounded-3xl text-center"><div class="w-16 h-16 mx-auto rounded-2xl bg-blue-50 flex items-center justify-center"><i class="fa-solid fa-user-slash text-2xl text-[#151c75]"></i></div><h1 class="mt-4 text-xl font-black text-[#151c75]">Halaman Creator belum tersedia.</h1><p class="mt-2 text-sm text-slate-500">Creator ini belum menayangkan halaman publiknya atau tautannya belum valid.</p><a href="/studio-ai" class="inline-flex mt-5 btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-bold">Kembali ke Studio AI</a></div>`;
      renderedFor = target.username;
      return;
    }

    const [catsRes, servicesRes, portfoliosRes] = await Promise.all([
      window.supabaseClient.from('creator_category_members').select('is_primary,ai_categories(id,name,icon)').eq('creator_id', profile.id),
      window.supabaseClient.from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id', profile.id).eq('is_active', true).order('created_at', { ascending: false }),
      window.supabaseClient.from('creator_portfolios').select('id,title,description,media_type,media_url,is_active,sort_order').eq('creator_id', profile.id).eq('is_active', true).order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    ]);

    const cats = (catsRes.data || []).map(x => x.ai_categories).filter(Boolean);
    const services = servicesRes.data || [];
    const portfolios = portfoliosRes.data || [];
    const avatar = profile.avatar_url || '';
    const verified = profile.is_verified ? '<span class="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-blue-600"><i class="fa-solid fa-check text-[9px]"></i></span>' : '';
    const star = profile.is_studihome_official || profile.managed_by_studihome ? '<span class="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-[9px] font-black">✦ Studihome</span>' : '';

    host.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <section class="overflow-hidden rounded-3xl bg-white border border-blue-100 shadow-sm">
          <div class="h-36 sm:h-48 bg-gradient-to-br from-[#151c75] to-[#3f48bf] relative">${profile.cover_url ? `<img src="${esc(profile.cover_url)}" class="w-full h-full object-cover" alt="">` : ''}</div>
          <div class="px-5 sm:px-8 pb-7">
            <div class="-mt-12 relative flex flex-col sm:flex-row sm:items-end gap-4">
              <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white bg-blue-50 overflow-hidden shadow-xl flex items-center justify-center">${avatar ? `<img src="${esc(avatar)}" alt="${esc(profile.display_name)}" class="w-full h-full object-cover">` : `<span class="text-3xl font-black text-[#151c75]">${esc((profile.display_name || 'C').charAt(0))}</span>`}</div>
              <div class="flex-1 min-w-0 pt-2 sm:pb-1"><div class="flex flex-wrap items-center gap-1"><h1 class="text-xl sm:text-2xl font-black text-[#151c75]">${esc(profile.display_name)}${verified}${star}</h1></div><p class="text-xs text-slate-500 mt-1">@${esc(profile.username)}${profile.location ? ` · ${esc(profile.location)}` : ''}</p>${cats.length ? `<div class="flex flex-wrap gap-2 mt-3">${cats.map(c => `<span class="px-2.5 py-1 rounded-lg bg-blue-50 text-[#151c75] text-[9px] font-extrabold">${esc(c.name)}</span>`).join('')}</div>` : ''}</div>
              ${profile.whatsapp ? `<a href="https://wa.me/${encodeURIComponent(String(profile.whatsapp).replace(/\D/g,''))}" target="_blank" rel="noopener noreferrer" class="btn-brand-gradient px-4 py-2.5 rounded-xl text-xs font-bold shrink-0"><i class="fa-brands fa-whatsapp mr-1"></i> Hubungi</a>` : ''}
            </div>
            ${profile.bio ? `<p class="mt-5 text-sm leading-relaxed text-slate-600 max-w-3xl">${esc(profile.bio)}</p>` : ''}
          </div>
        </section>

        <section class="mt-6"><div class="flex items-center justify-between gap-3"><h2 class="text-lg font-black text-[#151c75]">Hidangan</h2><span class="text-[10px] font-bold text-slate-400">${services.length} layanan</span></div><div class="grid md:grid-cols-2 gap-4 mt-3">${services.length ? services.map(s => `<article class="card-3d p-5 rounded-2xl"><h3 class="text-sm font-black text-[#151c75]">${esc(s.title)}</h3><p class="text-xs text-slate-500 mt-2 leading-relaxed">${esc(s.description || '')}</p><div class="mt-4 text-xs font-extrabold text-[#151c75]">Mulai Rp ${Number(s.price_from || 0).toLocaleString('id-ID')} · ${Number(s.delivery_days || 1)} hari</div></article>`).join('') : `<div class="col-span-full card-3d p-6 rounded-2xl text-center text-sm text-slate-500">Belum ada hidangan yang ditayangkan.</div>`}</div></section>

        <section class="mt-8"><div class="flex items-center justify-between gap-3"><h2 class="text-lg font-black text-[#151c75]">Ambalan</h2><span class="text-[10px] font-bold text-slate-400">${portfolios.length} karya</span></div><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">${portfolios.length ? portfolios.map((p,i) => `<button type="button" data-creator-media="${i}" class="text-left card-3d rounded-2xl overflow-hidden group"><div class="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">${mediaType(p.media_url)==='image' ? `<img src="${esc(p.media_url)}" alt="${esc(p.title)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` : `<div class="text-center px-5"><i class="fa-solid ${mediaType(p.media_url)==='video' ? 'fa-circle-play' : 'fa-arrow-up-right-from-square'} text-3xl text-[#151c75]"></i><div class="mt-2 text-[10px] font-bold text-slate-500">Buka media</div></div>`}</div><div class="p-4"><div class="text-xs font-extrabold text-[#151c75]">${esc(p.title)}</div><div class="text-[10px] text-slate-500 mt-1 line-clamp-2">${esc(p.description || '')}</div></div></button>`).join('') : `<div class="col-span-full card-3d p-6 rounded-2xl text-center text-sm text-slate-500">Belum ada karya yang ditayangkan.</div>`}</div></section>
      </div>`;

    const items = portfolios.map(p => p);
    host.querySelectorAll('[data-creator-media]').forEach(btn => btn.addEventListener('click', () => openMedia(items[Number(btn.dataset.creatorMedia)])));
    renderedFor = target.username;
  }

  function boot(){ load().catch(err => { console.error('[creator-public]', err); }); }
  window.addEventListener('popstate', () => { renderedFor = ''; setTimeout(boot, 100); });
  window.addEventListener('hashchange', () => { renderedFor = ''; setTimeout(boot, 100); });
  document.addEventListener('DOMContentLoaded', boot, { once: true });
  setTimeout(boot, 400);
})();
