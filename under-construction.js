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

  function loaderMarkup() {
    return `
      <div class="sh-loader" aria-label="Studihome sedang memuat" role="status">
        <div class="sh-loader-ring sh-loader-ring-a"></div>
        <div class="sh-loader-ring sh-loader-ring-b"></div>
        <div class="sh-loader-core">S</div>
        <div class="sh-loader-word" aria-hidden="true"><span>S</span><span>t</span><span>u</span><span>d</span><span>i</span><span>h</span><span>o</span><span>m</span><span>e</span></div>
        <div class="sh-loader-bar" aria-hidden="true"><span></span></div>
      </div>`;
  }

  function injectPublicStyles(doc) {
    const style = doc.createElement('style');
    style.textContent = `
      *{box-sizing:border-box}
      html{min-height:100%;background:#eef5ff}
      body{margin:0;min-height:100dvh;background:#eef5ff;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
      .sh-page{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:clamp(18px,4vw,48px);background:radial-gradient(circle at 50% 38%,rgba(63,72,191,.11),transparent 36%),linear-gradient(180deg,#edf5ff 0%,#f8fbff 100%);overflow:hidden;position:relative}
      .sh-glow{position:absolute;border-radius:999px;filter:blur(2px);pointer-events:none}
      .sh-glow-a{width:38vw;height:38vw;max-width:520px;max-height:520px;background:rgba(63,72,191,.08);top:-14vw;left:-12vw}
      .sh-glow-b{width:34vw;height:34vw;max-width:480px;max-height:480px;background:rgba(30,136,229,.07);right:-12vw;bottom:-14vw}
      .sh-panel{width:min(980px,100%);position:relative;padding:clamp(28px,6vw,64px);border:1px solid rgba(148,163,184,.22);border-radius:clamp(24px,4vw,38px);background:rgba(255,255,255,.84);box-shadow:0 30px 90px rgba(21,28,117,.12);backdrop-filter:blur(18px);text-align:center}
      .sh-brand{display:inline-flex;align-items:center;gap:10px;color:#151c75;font-weight:950;letter-spacing:.18em;font-size:clamp(11px,1.5vw,13px);text-transform:uppercase}
      .sh-brand-dot{width:9px;height:9px;border-radius:50%;background:#3f48bf;box-shadow:0 0 0 7px rgba(63,72,191,.11);animation:shPulse 1.8s ease-in-out infinite}
      .sh-loader{width:min(220px,52vw);height:min(220px,52vw);margin:clamp(20px,4vw,34px) auto 24px;position:relative;display:grid;place-items:center}
      .sh-loader-ring{position:absolute;border-radius:50%;border:1px solid rgba(63,72,191,.18)}
      .sh-loader-ring-a{inset:12%;animation:shSpin 5.2s linear infinite}
      .sh-loader-ring-a:after{content:"";position:absolute;top:50%;left:-3px;width:7px;height:7px;margin-top:-3px;border-radius:50%;background:#3f48bf;box-shadow:0 0 18px rgba(63,72,191,.8)}
      .sh-loader-ring-b{inset:24%;border-color:rgba(30,136,229,.18);animation:shSpinReverse 3.6s linear infinite}
      .sh-loader-ring-b:after{content:"";position:absolute;right:-3px;top:50%;width:7px;height:7px;margin-top:-3px;border-radius:50%;background:#1e88e5;box-shadow:0 0 18px rgba(30,136,229,.8)}
      .sh-loader-core{width:28%;height:28%;display:grid;place-items:center;border-radius:28%;background:linear-gradient(135deg,#151c75,#4f5bd8);color:#fff;font-weight:950;font-size:clamp(25px,6vw,42px);box-shadow:0 18px 45px rgba(21,28,117,.25);animation:shFloat 2.4s ease-in-out infinite}
      .sh-loader-word{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);display:flex;gap:.03em;color:#151c75;font-size:clamp(18px,4vw,30px);font-weight:950;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 8px 30px rgba(21,28,117,.1)}
      .sh-loader-word span{display:inline-block;animation:shLetter 1.55s ease-in-out infinite;animation-delay:calc(var(--i,0)*.065s)}
      .sh-loader-word span:nth-child(1){--i:0}.sh-loader-word span:nth-child(2){--i:1}.sh-loader-word span:nth-child(3){--i:2}.sh-loader-word span:nth-child(4){--i:3}.sh-loader-word span:nth-child(5){--i:4}.sh-loader-word span:nth-child(6){--i:5}.sh-loader-word span:nth-child(7){--i:6}.sh-loader-word span:nth-child(8){--i:7}.sh-loader-word span:nth-child(9){--i:8}
      .sh-loader-bar{width:clamp(120px,30vw,190px);height:4px;margin:auto;position:absolute;bottom:-4%;left:50%;transform:translateX(-50%);border-radius:999px;background:#e2e8f0;overflow:hidden}
      .sh-loader-bar span{display:block;width:42%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#151c75,#3f48bf,#1e88e5);animation:shLoad 1.4s ease-in-out infinite}
      .sh-title{margin:clamp(8px,2vw,14px) auto 10px;max-width:780px;color:#151c75;font-size:clamp(27px,5vw,48px);line-height:1.05;font-weight:950;letter-spacing:-.045em}
      .sh-desc{max-width:690px;margin:0 auto;color:#64748b;font-size:clamp(13px,2vw,16px);line-height:1.75;font-weight:600}
      .sh-ind{margin:clamp(22px,4vw,32px) auto 0;max-width:720px;padding:16px 18px;border:1px solid #fde68a;border-radius:20px;background:#fffbeb;text-align:left}
      .sh-ind-title{font-size:clamp(11px,1.7vw,13px);font-weight:900;color:#b45309;letter-spacing:.02em}
      .sh-ind-msg{margin-top:6px;font-size:clamp(12px,1.7vw,14px);line-height:1.7;color:#64748b}
      .sh-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:18px}
      .sh-wa{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:13px 17px;border-radius:15px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;text-decoration:none;font-size:12px;font-weight:900;box-shadow:0 12px 30px rgba(22,163,74,.18)}
      .sh-wa:focus-visible{outline:3px solid rgba(63,72,191,.35);outline-offset:3px}
      @keyframes shSpin{to{transform:rotate(360deg)}}
      @keyframes shSpinReverse{to{transform:rotate(-360deg)}}
      @keyframes shFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-7px) scale(1.03)}}
      @keyframes shPulse{0%,100%{transform:scale(1);opacity:.72}50%{transform:scale(1.22);opacity:1}}
      @keyframes shLetter{0%,70%,100%{transform:translateY(0);opacity:.72}35%{transform:translateY(-6px);opacity:1}}
      @keyframes shLoad{0%{transform:translateX(-130%)}50%{transform:translateX(110%)}100%{transform:translateX(250%)}}
      @media (max-width:640px){.sh-page{padding:14px}.sh-panel{padding:26px 17px 28px;border-radius:24px}.sh-loader{margin-top:18px}.sh-ind{text-align:center}.sh-actions{display:grid;grid-template-columns:1fr}.sh-wa{width:100%}}
      @media (prefers-reduced-motion:reduce){.sh-loader-ring-a,.sh-loader-ring-b,.sh-loader-core,.sh-loader-dot,.sh-loader-word span,.sh-loader-bar span,.sh-brand-dot{animation:none!important}}
    `;
    doc.head.appendChild(style);
  }

  function renderPublic(doc, settings) {
    doc.documentElement.style.background = '#eef5ff';
    doc.body.innerHTML = `
      <main class="sh-page" aria-labelledby="uc-title">
        <div class="sh-glow sh-glow-a"></div>
        <div class="sh-glow sh-glow-b"></div>
        <section class="sh-panel">
          <div class="sh-brand"><span class="sh-brand-dot"></span> STUDIHOME</div>
          <div class="sh-loader" aria-hidden="true">${loaderMarkup()}</div>
          <h1 id="uc-title" class="sh-title">${esc(settings.title)}</h1>
          <p class="sh-desc">${esc(settings.description)}</p>
          <div class="sh-ind">
            <div class="sh-ind-title">${esc(settings.independence_title)}</div>
            <div class="sh-ind-msg">${esc(settings.independence_message)}</div>
          </div>
          <div class="sh-actions">
            ${waUrl(settings) ? `<a class="sh-wa" href="${esc(waUrl(settings))}" target="_blank" rel="noopener noreferrer">◉ ${esc(settings.whatsapp_label || DEFAULTS.whatsapp_label)}</a>` : ''}
          </div>
        </section>
      </main>`;
    injectPublicStyles(doc);
  }

  async function saveSettings(patch) {
    const client = db();
    if (!client) throw new Error('Koneksi database belum siap.');
    const current = await getSettings();
    const next = {
      enabled: Boolean(patch.enabled ?? current.enabled),
      title: patch.title ?? current.title,
      description: patch.description ?? current.description,
      independence_title: patch.independence_title ?? current.independence_title,
      independence_message: patch.independence_message ?? current.independence_message,
      whatsapp_number: patch.whatsapp_number ?? current.whatsapp_number,
      whatsapp_message: patch.whatsapp_message ?? current.whatsapp_message,
      whatsapp_label: patch.whatsapp_label ?? current.whatsapp_label
    };
    const { error } = await client.from('site_settings').upsert({ id:1, under_construction:next }, { onConflict:'id' });
    if (error) throw error;
    return next;
  }

  const readForm = () => ({
    enabled: document.getElementById('uc-enabled')?.checked === true,
    title: document.getElementById('uc-title')?.value.trim() || DEFAULTS.title,
    description: document.getElementById('uc-description')?.value.trim() || DEFAULTS.description,
    independence_title: document.getElementById('uc-ind-title')?.value.trim() || DEFAULTS.independence_title,
    independence_message: document.getElementById('uc-ind-message')?.value.trim() || DEFAULTS.independence_message,
    whatsapp_number: document.getElementById('uc-wa-number')?.value.trim() || '',
    whatsapp_message: document.getElementById('uc-wa-message')?.value.trim() || DEFAULTS.whatsapp_message,
    whatsapp_label: document.getElementById('uc-wa-label')?.value.trim() || DEFAULTS.whatsapp_label
  });

  function adminMarkup(settings) {
    return `<div id="uc-admin-panel" class="space-y-5">
      <div class="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5"><div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Under Construction</h2><p class="mt-1 text-[10px] sm:text-xs text-slate-500">Mode maintenance terisolasi. Admin tetap dapat masuk dan mematikannya.</p></div><label class="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 cursor-pointer"><span class="text-xs font-black text-slate-700">Mode Under Construction</span><input id="uc-enabled" type="checkbox" ${settings.enabled?'checked':''} class="w-5 h-5 accent-[#151c75]"></label></div></div>
      <div class="grid gap-4">
        <section class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"><h3 class="text-sm font-black text-[#151c75]">Konten & Kontak</h3>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Judul</span><input id="uc-title" value="${esc(settings.title)}" maxlength="120" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Deskripsi</span><textarea id="uc-description" rows="4" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.description)}</textarea></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Judul ucapan kemerdekaan</span><input id="uc-ind-title" value="${esc(settings.independence_title)}" maxlength="140" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Pesan ucapan kemerdekaan</span><textarea id="uc-ind-message" rows="3" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.independence_message)}</textarea></label>
          <div class="grid sm:grid-cols-2 gap-3 pt-2">
            <label class="block"><span class="text-[10px] font-black text-slate-700">Nomor WhatsApp</span><input id="uc-wa-number" value="${esc(settings.whatsapp_number)}" placeholder="62812xxxx" inputmode="tel" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
            <label class="block"><span class="text-[10px] font-black text-slate-700">Label tombol WhatsApp</span><input id="uc-wa-label" value="${esc(settings.whatsapp_label)}" maxlength="60" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
          </div>
          <label class="block"><span class="text-[10px] font-black text-slate-700">Pesan WhatsApp</span><textarea id="uc-wa-message" rows="3" placeholder="Pesan WhatsApp" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.whatsapp_message)}</textarea></label>
        </section>
      </div>
      <div class="rounded-3xl border border-blue-100 bg-blue-50/60 p-5"><div class="flex items-start gap-3"><div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#151c75] font-black">S</div><div><div class="text-xs font-black text-[#151c75]">Animasi halaman</div><p class="mt-1 text-[10px] leading-6 text-slate-500">Halaman publik menggunakan animasi loading “Studihome” modern yang ringan dan responsif. Fitur gambar sudah dihapus dari panel maupun halaman publik.</p></div></div></div>
      <div class="flex flex-wrap gap-2"><button id="uc-save" type="button" class="rounded-xl bg-[#151c75] px-4 py-2.5 text-[10px] font-extrabold text-white">Simpan Perubahan</button><button id="uc-preview" type="button" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[10px] font-extrabold text-[#151c75]">Preview Halaman</button></div>
    </div>`;
  }

  async function renderAdmin(target = document.getElementById('admin-content-area')) {
    if(!target)return;
    let settings = await getSettings();
    target.innerHTML = adminMarkup(settings);

    target.querySelector('#uc-save')?.addEventListener('click', async () => {
      try {
        settings = await saveSettings(readForm());
        await renderAdmin(target);
        toast('Pengaturan berhasil disimpan.', 'success');
      } catch (e) {
        toast(e.message || 'Pengaturan belum tersimpan. Silakan coba lagi.', 'error');
      }
    });

    target.querySelector('#uc-preview')?.addEventListener('click', () => {
      const preview = readForm();
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) {
        toast('Popup preview diblokir browser. Izinkan popup untuk melihat preview.', 'error');
        return;
      }
      w.document.open();
      w.document.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview Under Construction</title></head><body></body></html>');
      w.document.close();
      renderPublic(w.document, preview);
    });
  }

  window.StudihomeUnderConstruction = Object.freeze({ getSettings, renderAdmin, renderPublic });

  async function boot() {
    try {
      if (ADMIN) return;
      if (!ROOT) return;
      const settings = await getSettings();
      if (settings.enabled) renderPublic(document, settings);
    } catch (e) {
      console.warn('[Studihome Under Construction]', e?.message || e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();