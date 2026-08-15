(() => {
  'use strict';

  window.App = window.App || {};
  window.App.utils = window.App.utils || {};
  if (typeof window.App.utils.escapeHtml !== 'function') {
    window.App.utils.escapeHtml = (value) => {
      const text = String(value ?? '');
      const node = document.createElement('textarea');
      node.textContent = text;
      return node.innerHTML;
    };
  }

  const PLACEHOLDER_ID = 'kamar-creator-entry';
  const CARD_ID = 'studihome-dapur-entry';
  const LEGACY_ID = 'studihome-open-dapur';
  const RESERVED = new Set(['','/','/products','/kamar','/admin','/studio-ai','/dapur','/dapur/foyer','/dapur/menu','/dapur/hidangan','/dapur/ambalan','/ruang-kerja','/creator-studio','/dashboard','/ai-video','/ai-automation','/ai-content','/ai-untuk-guru','/ai-untuk-umkm']);

  function path() { return (location.pathname || '/').replace(/\/+$/, '') || '/'; }
  function isKamar() { return path() === '/kamar'; }
  function isDapur() { return /^\/dapur(?:\/|$)/i.test(path()); }
  function isFoyer() { return /^\/dapur\/foyer$/i.test(path()); }
  function isCreatorPath() {
    const current = path();
    return !RESERVED.has(current) && /^\/[a-z0-9][a-z0-9-]{2,39}(?:\/portfolio\/[a-z0-9][a-z0-9-]{0,120})?$/i.test(current);
  }

  function goDapur() {
    try {
      if (window.App?.router?.navigate) { window.App.router.navigate('dapur'); return; }
    } catch (_) {}
    location.href = '/dapur';
  }

  function renderKamarEntry() {
    if (!isKamar()) return;
    const host = document.getElementById(PLACEHOLDER_ID);
    if (!host || document.getElementById(CARD_ID)) return;
    host.classList.remove('hidden');
    host.innerHTML = `<div id="${CARD_ID}" class="card-3d p-4 sm:p-5 rounded-2xl mb-6 bg-white border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"><div class="flex items-start gap-3 min-w-0"><div class="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0"><i class="fa-solid fa-kitchen-set text-[#151c75]"></i></div><div class="min-w-0"><div class="text-xs font-extrabold text-[#151c75]">Dapur Creator ✨</div><div class="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">Kelola Foyer, Menu, Hidangan, dan Ambalan dari satu ruang pribadi.</div></div></div><button type="button" id="${LEGACY_ID}" class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[11px] font-bold shrink-0">Buka Dapur</button></div>`;
    document.getElementById(LEGACY_ID)?.addEventListener('click', goDapur, { once: true });
  }

  function autoDetectMedia(url) {
    let u; try { u = new URL(String(url || '').trim()); } catch (_) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.toLowerCase(); const filePath = u.pathname.toLowerCase();
    if ((host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be') && (u.searchParams.get('v') || host === 'youtu.be')) return 'youtube';
    if (/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host)) return 'drive';
    if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/\.(png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(filePath)) return 'image';
    if (/\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i.test(filePath)) return 'video';
    return 'link';
  }

  function normalizePortfolioForm() {
    if (!isDapur()) return;
    const select = document.getElementById('cp-type'); const url = document.getElementById('cp-url'); if (!url) return;
    const type = autoDetectMedia(url.value) || 'link';
    if (select) { select.value = type; select.classList.add('hidden'); select.setAttribute('aria-hidden', 'true'); select.dataset.studihomeAutoType = '1'; }
    url.placeholder = 'Tempel tautan foto, video, YouTube, Drive, TikTok, atau Instagram'; url.setAttribute('inputmode','url'); url.setAttribute('autocomplete','url');
    url.oninput = () => { const detected = autoDetectMedia(url.value) || 'link'; if (select) select.value = detected; };
  }

  function hardenPortfolioSave() {
    if (!window.App?.creatorStudio || window.App.creatorStudio.__dapurPortfolioAutoLocked) return;
    if (typeof window.App.creatorStudio.savePortfolio !== 'function') return;
    const original = window.App.creatorStudio.savePortfolio.bind(window.App.creatorStudio);
    window.App.creatorStudio.savePortfolio = async function(id = '') { const url = String(document.getElementById('cp-url')?.value || '').trim(); const type = autoDetectMedia(url); if (!type) { window.App.ui?.toast?.('Tautan media belum valid. Gunakan URL http/https yang benar.', 'error'); return; } const select=document.getElementById('cp-type'); if(select)select.value=type; return original(id); };
    window.App.creatorStudio.__dapurPortfolioAutoLocked = true;
  }

  async function getOwnCreator() {
    if (!window.supabaseClient || !window.App?.state?.user?.id) return null;
    const { data, error } = await window.supabaseClient.from('creator_profiles').select('id,username,display_name,avatar_url,managed_by_studihome,is_published').eq('user_id', window.App.state.user.id).eq('managed_by_studihome', false).limit(1).maybeSingle();
    if (error) throw error; return data || null;
  }

  async function compressLogo(file) {
    if (!(file instanceof File)) throw new Error('File logo tidak valid.');
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) throw new Error('Logo harus PNG, JPG, atau WebP.');
    if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran file maksimal 8 MB sebelum kompresi.');
    const bitmap = await createImageBitmap(file); const maxSide=800; const ratio=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)); const w=Math.max(1,Math.round(bitmap.width*ratio)); const h=Math.max(1,Math.round(bitmap.height*ratio));
    const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h; const ctx=canvas.getContext('2d',{alpha:true}); ctx.clearRect(0,0,w,h); ctx.drawImage(bitmap,0,0,w,h); bitmap.close?.();
    let quality=.84; let blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Kompresi logo gagal.')),'image/webp',quality));
    while(blob.size>350*1024&&quality>.56){quality-=.08;blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Kompresi logo gagal.')),'image/webp',quality));}
    return blob;
  }

  async function uploadLogo(file) {
    const creator=await getOwnCreator(); if(!creator)throw new Error('Profil Creator pribadi belum tersedia.'); const blob=await compressLogo(file); const uid=window.App.state.user.id; const path=`${uid}/avatar/${creator.id}-${Date.now()}.webp`;
    const {error:uploadError}=await window.supabaseClient.storage.from('creator-media').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'31536000'}); if(uploadError)throw uploadError;
    const {data}=window.supabaseClient.storage.from('creator-media').getPublicUrl(path); const avatarUrl=data?.publicUrl; if(!avatarUrl)throw new Error('URL logo tidak berhasil dibuat.');
    const {error}=await window.supabaseClient.from('creator_profiles').update({avatar_url:avatarUrl}).eq('id',creator.id).eq('user_id',uid).eq('managed_by_studihome',false); if(error)throw error; return {avatarUrl,size:blob.size};
  }

  async function renderFoyerAvatar() {
    if (!isFoyer() || document.getElementById('studihome-foyer-avatar')) return;
    const creator=await getOwnCreator().catch(()=>null); if(!creator)return; const workspace=document.querySelector('.room-workspace')||document.getElementById('main-content'); if(!workspace)return;
    const card=document.createElement('section'); card.id='studihome-foyer-avatar'; card.className='card-3d p-5 sm:p-6 rounded-3xl mb-6'; const initial=String(creator.display_name||creator.username||'C').charAt(0).toUpperCase(); const src=creator.avatar_url?App.utils.escapeHtml(creator.avatar_url):'';
    card.innerHTML=`<div class="flex flex-col sm:flex-row gap-5 items-start sm:items-center"><div id="foyer-avatar-preview" class="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-blue-50 border border-blue-100 overflow-hidden flex items-center justify-center shrink-0">${src?`<img src="${src}" alt="Logo ${App.utils.escapeHtml(creator.display_name||'Creator')}" class="w-full h-full object-contain bg-white" loading="eager">`:`<span class="text-4xl font-black text-[#151c75]">${App.utils.escapeHtml(initial)}</span>`}</div><div class="min-w-0 flex-1"><div class="text-[9px] font-black uppercase tracking-[.08em] text-amber-600">FOYER · Identitas Brand</div><h2 class="mt-1 text-base sm:text-lg font-black text-[#151c75]">Logo Creator</h2><p class="mt-1 text-[10px] sm:text-xs text-slate-500 leading-relaxed">Unggah logo brand yang jelas. Sistem otomatis mengecilkan ukuran gambar, mengubahnya ke WebP, dan mengoptimalkannya untuk tampilan profil.</p><div class="mt-3 flex flex-wrap gap-2 items-center"><label class="btn-brand-gradient px-3.5 py-2 rounded-xl text-[10px] font-extrabold cursor-pointer"><i class="fa-solid fa-cloud-arrow-up mr-1"></i> Unggah Logo<input id="foyer-avatar-input" type="file" accept="image/png,image/jpeg,image/webp" class="hidden"></label><span class="text-[9px] text-slate-400">PNG/JPG/WebP · max 8 MB</span></div><div id="foyer-avatar-status" class="mt-2 text-[9px] text-slate-500"></div></div></div>`;
    workspace.prepend(card);
    card.querySelector('#foyer-avatar-input')?.addEventListener('change',async(e)=>{const file=e.target.files?.[0];if(!file)return;const status=card.querySelector('#foyer-avatar-status');status.textContent='Mengompres dan menyimpan logo…';try{const result=await uploadLogo(file);card.querySelector('#foyer-avatar-preview').innerHTML=`<img src="${App.utils.escapeHtml(result.avatarUrl)}" alt="Logo Creator" class="w-full h-full object-contain bg-white" loading="eager">`;status.innerHTML=`<span class="text-emerald-600 font-bold">Logo tersimpan.</span> Ukuran hasil ${(result.size/1024).toFixed(0)} KB.`;App.ui?.toast?.('Logo brand berhasil dikompres dan disimpan.','success');}catch(err){status.innerHTML=`<span class="text-red-600">${App.utils.escapeHtml(err?.message||'Logo belum bisa disimpan.')}</span>`;App.ui?.toast?.(err?.message||'Logo belum bisa disimpan.','error');}finally{e.target.value='';}});
  }

  function ensurePublicCreatorModule() {
    if (!isCreatorPath()) return;
    if (document.querySelector('script[data-studihome-creator-public]')) return;
    const s=document.createElement('script'); s.src='/creator-public.js?v=2'; s.dataset.studihomeCreatorPublic='1'; s.defer=true; document.head.appendChild(s);
  }

  function ensureAdminDapurRouter() {
    if (!isDapur() || String(window.App?.state?.user?.role || '').toLowerCase() !== 'admin') return;
    if (window.StudihomeDapurAdminRouterV2 || document.querySelector('script[data-studihome-dapur-admin-router-v2]')) return;
    const s=document.createElement('script'); s.src='/dapur-admin-router-v2.js?v=2'; s.dataset.studihomeDapurAdminRouterV2='1'; s.defer=true; document.head.appendChild(s);
  }

  function tick() {
    if (path() === '/admin') return;
    ensureAdminDapurRouter();
    renderKamarEntry(); normalizePortfolioForm(); hardenPortfolioSave(); ensurePublicCreatorModule(); renderFoyerAvatar();
  }

  function scheduleRefreshes() { tick(); window.setTimeout(tick,600); window.setTimeout(tick,1600); }
  window.StudihomeDapurUI=Object.freeze({refresh:scheduleRefreshes,goDapur});
  window.addEventListener('popstate',scheduleRefreshes); window.addEventListener('hashchange',scheduleRefreshes);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleRefreshes,{once:true});else scheduleRefreshes();
})();
