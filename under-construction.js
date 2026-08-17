(() => {
  'use strict';

  const PATH = location.pathname.replace(/\/+$/, '') || '/';
  const ROOT = PATH === '/';
  const ADMIN = PATH === '/admin';
  const DEFAULTS = {
    enabled: false,
    title: 'Website Sedang Dalam Pengembangan',
    description: 'Kami sedang mempersiapkan sesuatu yang lebih baik untuk Anda. Silakan kembali dalam waktu dekat.',
    independence_title: 'Selamat Hari Kemerdekaan Republik Indonesia 🇮🇩',
    independence_message: 'Mari terus melangkah, berkarya, dan tumbuh bersama untuk Indonesia yang lebih maju.',
    image_url: '',
    whatsapp_number: '',
    whatsapp_message: 'Halo Studihome, saya ingin mengetahui informasi terbaru.',
    whatsapp_label: 'Hubungi Kami via WhatsApp'
  };

  const db = () => window.supabaseClient || null;
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  async function getSettings() {
    const client = db();
    if (!client?.from) return { ...DEFAULTS };
    const { data, error } = await client.from('site_settings').select('under_construction').eq('id', 1).maybeSingle();
    if (error) throw error;
    return { ...DEFAULTS, ...(data?.under_construction || {}) };
  }

  const waNumber = value => String(value || '').replace(/\D/g, '').replace(/^0+/, '');
  const waUrl = settings => {
    const number = waNumber(settings.whatsapp_number);
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(String(settings.whatsapp_message || ''))}` : '';
  };

  function renderPublic(doc, settings) {
    doc.documentElement.style.background = '#EBF3FF';
    doc.body.innerHTML = `
      <main aria-labelledby="uc-title" style="min-height:100dvh;background:linear-gradient(180deg,#EBF3FF 0%,#F8FBFF 100%);display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif;color:#0F172A;">
        <section style="width:min(980px,100%);background:#fff;border:1px solid #D8E6FF;border-radius:32px;box-shadow:0 24px 70px rgba(21,28,117,.12);overflow:hidden;">
          <div style="background:linear-gradient(135deg,#151c75 0%,#3f48bf 100%);color:#fff;padding:28px;">
            <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;">✦ STUDIHOME</div>
            <h1 id="uc-title" style="font-size:clamp(28px,5vw,46px);line-height:1.05;margin:20px 0 12px;font-weight:900;letter-spacing:-.03em;">${esc(settings.title)}</h1>
            <p style="max-width:720px;margin:0;color:#DBEAFE;line-height:1.7;font-size:15px;font-weight:600;">${esc(settings.description)}</p>
          </div>
          <div style="padding:28px;display:grid;grid-template-columns:1.1fr .9fr;gap:24px;">
            <div>
              <div style="padding:18px 20px;border:1px solid #FDE68A;background:#FFFBEB;border-radius:22px;margin-bottom:18px;">
                <div style="font-size:12px;font-weight:900;color:#B45309;text-transform:uppercase;letter-spacing:.08em;">${esc(settings.independence_title)}</div>
                <div style="margin-top:8px;font-size:14px;color:#475569;line-height:1.7;">${esc(settings.independence_message)}</div>
              </div>
              ${waUrl(settings) ? `<a href="${esc(waUrl(settings))}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 18px;border-radius:16px;background:linear-gradient(135deg,#16A34A,#15803D);color:#fff;text-decoration:none;font-weight:900;font-size:13px;">◉ ${esc(settings.whatsapp_label || DEFAULTS.whatsapp_label)}</a>` : '<div style="font-size:12px;color:#64748B;">Kontak WhatsApp sedang disiapkan.</div>'}
            </div>
            <div style="display:flex;align-items:center;justify-content:center;min-height:220px;border-radius:24px;background:linear-gradient(135deg,#F1F5FF,#FFFFFF);border:1px solid #E2E8F0;overflow:hidden;">
              ${settings.image_url ? `<img src="${esc(settings.image_url)}" alt="Ucapan Studihome" style="width:100%;height:100%;min-height:220px;object-fit:cover;display:block;" loading="eager" onerror="this.style.display='none';this.parentElement.insertAdjacentHTML('beforeend','<div style=\"padding:24px;text-align:center;color:#64748B;font-size:12px;\">Gambar belum dapat dimuat.</div>')">` : '<div style="padding:24px;text-align:center;color:#64748B;font-size:12px;">Area gambar utama dapat diatur dari Panel Admin.</div>'}
            </div>
          </div>
        </section>
      </main>`;
  }

  async function validateImage(file) {
    if (!file) return { ok:false, message:'Pilih gambar terlebih dahulu.' };
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return { ok:false, message:'Format gambar harus JPG, PNG, atau WEBP.' };
    if (file.size > 3 * 1024 * 1024) return { ok:false, message:'Ukuran gambar maksimal 3 MB.' };
    const url = URL.createObjectURL(file);
    const dims = await new Promise(resolve => { const img = new Image(); img.onload=()=>resolve({w:img.naturalWidth,h:img.naturalHeight}); img.onerror=()=>resolve(null); img.src=url; });
    URL.revokeObjectURL(url);
    return dims?.w && dims?.h ? {ok:true,dims} : {ok:false,message:'Gambar tidak dapat dibaca.'};
  }

  async function uploadImage(file) {
    const client = db();
    if (!client) throw new Error('Koneksi database belum siap.');
    const check = await validateImage(file);
    if (!check.ok) throw new Error(check.message);
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `under-construction/${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage.from('site-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'31536000'});
    if (error) throw error;
    return client.storage.from('site-media').getPublicUrl(path).data.publicUrl;
  }

  const objectPathFromPublicUrl = url => {
    const marker = '/storage/v1/object/public/site-media/';
    const i = String(url || '').indexOf(marker);
    return i >= 0 ? String(url).slice(i + marker.length) : '';
  };

  async function saveSettings(patch) {
    const client = db();
    if (!client) throw new Error('Koneksi database belum siap.');
    const current = await getSettings();
    const next = { ...current, ...patch, enabled: Boolean(patch.enabled ?? current.enabled) };
    const { error } = await client.from('site_settings').upsert({ id:1, under_construction:next }, { onConflict:'id' });
    if (error) throw error;
    return next;
  }

  const readForm = settings => ({
    enabled: document.getElementById('uc-enabled')?.checked === true,
    title: document.getElementById('uc-title')?.value.trim() || DEFAULTS.title,
    description: document.getElementById('uc-description')?.value.trim() || DEFAULTS.description,
    independence_title: document.getElementById('uc-ind-title')?.value.trim() || DEFAULTS.independence_title,
    independence_message: document.getElementById('uc-ind-message')?.value.trim() || DEFAULTS.independence_message,
    image_url: settings.image_url || '',
    whatsapp_number: document.getElementById('uc-wa-number')?.value.trim() || '',
    whatsapp_message: document.getElementById('uc-wa-message')?.value.trim() || DEFAULTS.whatsapp_message,
    whatsapp_label: document.getElementById('uc-wa-label')?.value.trim() || DEFAULTS.whatsapp_label
  });

  function adminMarkup(settings) {
    return `<div id="uc-admin-panel" class="space-y-5">
      <div class="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5"><div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Under Construction</h2><p class="mt-1 text-[10px] sm:text-xs text-slate-500">Mode maintenance terisolasi. Admin tetap dapat masuk dan mematikannya.</p></div><label class="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 cursor-pointer"><span class="text-xs font-black text-slate-700">Mode Under Construction</span><input id="uc-enabled" type="checkbox" ${settings.enabled?'checked':''} class="w-5 h-5 accent-[#151c75]"></label></div></div>
      <div class="grid xl:grid-cols-2 gap-4">
        <section class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"><h3 class="text-sm font-black text-[#151c75]">Konten</h3>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Judul</span><input id="uc-title" value="${esc(settings.title)}" maxlength="120" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Deskripsi</span><textarea id="uc-description" rows="4" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.description)}</textarea></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Judul ucapan kemerdekaan</span><input id="uc-ind-title" value="${esc(settings.independence_title)}" maxlength="140" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Pesan ucapan kemerdekaan</span><textarea id="uc-ind-message" rows="3" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.independence_message)}</textarea></label>
        </section>
        <section class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"><h3 class="text-sm font-black text-[#151c75]">Gambar & WhatsApp</h3>
          <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-3"><div class="text-[9px] font-bold text-slate-600">Rekomendasi: 16:9 atau 1:1 · JPG/PNG/WEBP · maks 3 MB.</div><div class="mt-2 flex flex-wrap gap-2"><input id="uc-image-file" type="file" accept="image/jpeg,image/png,image/webp" class="text-[10px]"><button id="uc-upload" type="button" class="rounded-xl bg-[#151c75] px-3 py-2 text-[10px] font-extrabold text-white">Upload</button></div></div>
          ${settings.image_url ? `<div class="rounded-2xl overflow-hidden border border-slate-100"><img src="${esc(settings.image_url)}" alt="Preview" class="w-full aspect-video object-cover"><button id="uc-remove-image" type="button" class="w-full py-2 text-[10px] font-bold text-red-700 bg-red-50">Hapus gambar</button></div>` : '<div class="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-[10px] text-slate-400">Belum ada gambar.</div>'}
          <input id="uc-wa-number" value="${esc(settings.whatsapp_number)}" placeholder="62812xxxx" inputmode="tel" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">
          <textarea id="uc-wa-message" rows="3" placeholder="Pesan WhatsApp" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.whatsapp_message)}</textarea>
          <input id="uc-wa-label" value="${esc(settings.whatsapp_label)}" maxlength="60" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">
        </section>
      </div>
      <div class="flex flex-wrap gap-2"><button id="uc-save" type="button" class="rounded-xl bg-[#151c75] px-4 py-2.5 text-[10px] font-extrabold text-white">Simpan Perubahan</button><button id="uc-preview" type="button" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[10px] font-extrabold text-[#151c75]">Preview Halaman</button></div>
    </div>`;
  }

  async function renderAdmin(target = document.getElementById('admin-content-area')) {
    if(!target)return;
    let settings=await getSettings();
    target.innerHTML=adminMarkup(settings);
    target.querySelector('#uc-save')?.addEventListener('click',async()=>{
      try{settings=await saveSettings(readForm(settings));await renderAdmin(target);toast('Pengaturan berhasil disimpan.','success')}
      catch(e){toast(e.message||'Pengaturan belum tersimpan. Silakan coba lagi.','error')}
    });
    target.querySelector('#uc-preview')?.addEventListener('click',()=>{
      const preview=readForm(settings); const w=window.open('', '_blank', 'noopener,noreferrer');
      if(!w){toast('Popup preview diblokir browser. Izinkan popup untuk melihat preview.','error');return;}
      w.document.open(); w.document.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview Under Construction</title></head><body></body></html>'); w.document.close(); renderPublic(w.document,preview);
    });
    target.querySelector('#uc-upload')?.addEventListener('click',async()=>{
      const file=target.querySelector('#uc-image-file')?.files?.[0];
      try{settings=await saveSettings({image_url:await uploadImage(file)});await renderAdmin(target);toast('Gambar berhasil diunggah.','success')}
      catch(e){toast(e.message||'Upload gambar gagal.','error')}
    });
    target.querySelector('#uc-remove-image')?.addEventListener('click',async()=>{
      try{
        const old=settings.image_url;
        settings=await saveSettings({image_url:''});
        const path=objectPathFromPublicUrl(old);
        if(path)await db().storage.from('site-media').remove([path]);
        await renderAdmin(target);
        toast('Gambar dihapus.','success')
      }catch(e){toast(e.message||'Gambar belum bisa dihapus.','error')}
    });
  }

  window.StudihomeUnderConstruction = Object.freeze({ getSettings, renderAdmin, renderPublic });

  async function boot(){
    try{
      if(ADMIN)return;
      if(!ROOT)return;
      const settings=await getSettings();
      if(settings.enabled)renderPublic(document,settings);
    }catch(e){console.warn('[Studihome Under Construction]',e?.message||e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
