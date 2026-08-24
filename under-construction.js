(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const ROOT = PATH === '/';
  const ADMIN = PATH === '/admin';
  const AUTH_ROUTES = new Set(['/auth/callback', '/login', '/register']);
  const DEFAULTS = {
    enabled: false,
    title: 'Lagi kami upgrade ✦',
    description: 'Studihome lagi dirapikan biar makin nyaman. Santai dulu, sebentar lagi balik dengan pengalaman yang lebih fresh.',
        whatsapp_number: '',
    whatsapp_message: 'Halo Studihome, saya ingin tahu update terbarunya.',
    whatsapp_label: 'Ngobrol sama Admin'
  };

  const db = () => window.supabaseClient || null;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const toast = (m, t = 'info') => window.App?.ui?.toast?.(m, t);

  async function getSettings() {
    const client = db();
    if (!client?.from) return { ...DEFAULTS };
    const { data, error } = await client.from('site_settings').select('under_construction').eq('id', 1).maybeSingle();
    if (error) throw error;
    return { ...DEFAULTS, ...(data?.under_construction || {}) };
  }

  async function getUser() {
    const client = db();
    if (!client?.auth) return null;
    try {
      const { data } = await client.auth.getUser();
      return data?.user || null;
    } catch (_) {
      return null;
    }
  }

  function isAllowedWithoutSession() {
    return ROOT || AUTH_ROUTES.has(PATH);
  }

  async function enforcePublicGate(settings) {
    if (!settings.enabled || isAllowedWithoutSession()) return false;
    const user = await getUser();
    if (user) return false;
    window.location.replace('/');
    return true;
  }

  const waNumber = value => String(value || '').replace(/\D/g, '').replace(/^0+/, '');
  const waUrl = settings => {
    const number = waNumber(settings.whatsapp_number);
    return number ? `https://wa.me/${number}?text=${encodeURIComponent(String(settings.whatsapp_message || ''))}` : '';
  };

  function loaderMarkup() {
    return `
      <div class="sh-loader" role="status" aria-label="Studihome sedang menyiapkan sesuatu yang baru">
        <div class="sh-loader-ring sh-loader-ring-a"></div>
        <div class="sh-loader-ring sh-loader-ring-b"></div>
        <div class="sh-loader-core">✦</div>
        <div class="sh-loader-word" aria-hidden="true"><span>S</span><span>t</span><span>u</span><span>d</span><span>i</span><span>h</span><span>o</span><span>m</span><span>e</span></div>
        <div class="sh-loader-bar" aria-hidden="true"><span></span></div>
      </div>`;
  }

  function injectStyles(doc) {
    const style = doc.createElement('style');
    style.textContent = `
      *{box-sizing:border-box}
      html{min-height:100%;background:#eef5ff}
      body{margin:0;min-height:100dvh;background:#eef5ff;color:#0f172a;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
      .sh-page{min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:clamp(16px,4vw,48px);background:radial-gradient(circle at 50% 36%,rgba(63,72,191,.13),transparent 36%),linear-gradient(180deg,#edf5ff 0%,#f9fbff 100%);overflow:hidden;position:relative}
      .sh-glow{position:absolute;border-radius:999px;pointer-events:none;filter:blur(2px)}
      .sh-glow-a{width:40vw;height:40vw;max-width:520px;max-height:520px;top:-15vw;left:-12vw;background:rgba(63,72,191,.09)}
      .sh-glow-b{width:34vw;height:34vw;max-width:460px;max-height:460px;right:-12vw;bottom:-14vw;background:rgba(30,136,229,.08)}
      .sh-panel{width:min(900px,100%);padding:clamp(26px,6vw,64px);position:relative;border:1px solid rgba(148,163,184,.22);border-radius:clamp(24px,4vw,38px);background:rgba(255,255,255,.88);box-shadow:0 30px 90px rgba(21,28,117,.12);backdrop-filter:blur(18px);text-align:center}
      .sh-brand{display:inline-flex;align-items:center;gap:9px;color:#151c75;font-weight:950;letter-spacing:.15em;font-size:clamp(10px,1.6vw,13px);text-transform:uppercase}
      .sh-brand-star{font-size:1.2em;animation:shPulse 1.7s ease-in-out infinite}
      .sh-loader{width:min(220px,56vw);height:min(220px,56vw);margin:clamp(22px,4vw,34px) auto 24px;position:relative;display:grid;place-items:center}
      .sh-loader-ring{position:absolute;border-radius:50%;border:1px solid rgba(63,72,191,.18)}
      .sh-loader-ring-a{inset:10%;animation:shSpin 5.2s linear infinite}
      .sh-loader-ring-a:after{content:"";position:absolute;top:50%;left:-3px;width:7px;height:7px;margin-top:-3px;border-radius:50%;background:#3f48bf;box-shadow:0 0 18px rgba(63,72,191,.8)}
      .sh-loader-ring-b{inset:24%;border-color:rgba(30,136,229,.18);animation:shSpinReverse 3.6s linear infinite}
      .sh-loader-ring-b:after{content:"";position:absolute;right:-3px;top:50%;width:7px;height:7px;margin-top:-3px;border-radius:50%;background:#1e88e5;box-shadow:0 0 18px rgba(30,136,229,.8)}
      .sh-loader-core{width:29%;height:29%;display:grid;place-items:center;border-radius:30%;background:linear-gradient(135deg,#151c75,#4f5bd8);color:#fff;font-weight:950;font-size:clamp(30px,7vw,46px);line-height:1;box-shadow:0 18px 45px rgba(21,28,117,.25);animation:shFloat 2.4s ease-in-out infinite}
      .sh-loader-word{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);display:flex;gap:.02em;color:#151c75;font-size:clamp(18px,4vw,30px);font-weight:950;letter-spacing:-.045em;white-space:nowrap;text-shadow:0 8px 30px rgba(21,28,117,.1)}
      .sh-loader-word span{display:inline-block;animation:shLetter 1.55s ease-in-out infinite;animation-delay:calc(var(--i,0)*.065s)}
      .sh-loader-word span:nth-child(1){--i:0}.sh-loader-word span:nth-child(2){--i:1}.sh-loader-word span:nth-child(3){--i:2}.sh-loader-word span:nth-child(4){--i:3}.sh-loader-word span:nth-child(5){--i:4}.sh-loader-word span:nth-child(6){--i:5}.sh-loader-word span:nth-child(7){--i:6}.sh-loader-word span:nth-child(8){--i:7}.sh-loader-word span:nth-child(9){--i:8}
      .sh-loader-bar{position:absolute;left:50%;bottom:-4%;width:clamp(120px,30vw,190px);height:4px;transform:translateX(-50%);border-radius:999px;background:#e2e8f0;overflow:hidden}
      .sh-loader-bar span{display:block;width:42%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#151c75,#3f48bf,#1e88e5);animation:shLoad 1.4s ease-in-out infinite}
      .sh-title{margin:clamp(8px,2vw,14px) auto 10px;max-width:760px;color:#151c75;font-size:clamp(28px,5vw,48px);line-height:1.04;font-weight:950;letter-spacing:-.045em}
      .sh-desc{max-width:680px;margin:0 auto;color:#64748b;font-size:clamp(13px,2vw,16px);line-height:1.75;font-weight:600}
      .sh-actions{display:flex;justify-content:center;margin-top:18px}
      .sh-wa{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:13px 18px;border-radius:15px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;text-decoration:none;font-size:12px;font-weight:900;box-shadow:0 12px 30px rgba(37,99,235,.22);transition:transform .2s ease,box-shadow .2s ease}
      .sh-wa:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgba(37,99,235,.28)}
      .sh-wa:focus-visible{outline:3px solid rgba(37,99,235,.28);outline-offset:3px}
      @keyframes shSpin{to{transform:rotate(360deg)}}
      @keyframes shSpinReverse{to{transform:rotate(-360deg)}}
      @keyframes shFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-7px) scale(1.04)}}
      @keyframes shPulse{0%,100%{transform:scale(1);opacity:.72}50%{transform:scale(1.2);opacity:1}}
      @keyframes shLetter{0%,70%,100%{transform:translateY(0);opacity:.72}35%{transform:translateY(-6px);opacity:1}}
      @keyframes shLoad{0%{transform:translateX(-130%)}50%{transform:translateX(110%)}100%{transform:translateX(250%)}}
      @media(max-width:640px){.sh-page{padding:12px}.sh-panel{padding:24px 16px 28px;border-radius:24px}.sh-actions{display:grid}.sh-wa{width:100%}}
      @media(prefers-reduced-motion:reduce){.sh-loader-ring-a,.sh-loader-ring-b,.sh-loader-core,.sh-loader-word span,.sh-loader-bar span,.sh-brand-star{animation:none!important;opacity:1!important;transform:none!important}}
    `;
    doc.head.appendChild(style);
  }

  function renderPublic(doc, settings) {
    doc.documentElement.style.background = '#eef5ff';
    doc.body.innerHTML = `
      <main class="sh-page" aria-labelledby="uc-title">
        <div class="sh-glow sh-glow-a"></div><div class="sh-glow sh-glow-b"></div>
        <section class="sh-panel">
          <div class="sh-brand"><span class="sh-brand-star">✦</span> Studihome</div>
          ${loaderMarkup()}
          <h1 id="uc-title" class="sh-title">${esc(settings.title)}</h1>
          <p class="sh-desc">${esc(settings.description)}</p>

          ${waUrl(settings) ? `<div class="sh-actions"><a class="sh-wa" href="${esc(waUrl(settings))}" target="_blank" rel="noopener noreferrer">✦ ${esc(settings.whatsapp_label || DEFAULTS.whatsapp_label)}</a></div>` : ''}
        </section>
      </main>`;
    injectStyles(doc);
  }

  async function saveSettings(patch) {
    const client = db();
    if (!client) throw new Error('Koneksi database belum siap.');
    const current = await getSettings();
    const next = {
      enabled: Boolean(patch.enabled ?? current.enabled),
      title: patch.title ?? current.title,
      description: patch.description ?? current.description,
      whatsapp_number: patch.whatsapp_number ?? current.whatsapp_number,
      whatsapp_message: patch.whatsapp_message ?? current.whatsapp_message,
      whatsapp_label: patch.whatsapp_label ?? current.whatsapp_label
    };
    const { error } = await client.from('site_settings').upsert({ id: 1, under_construction: next }, { onConflict: 'id' });
    if (error) throw error;
    return next;
  }

  const readForm = () => ({
    enabled: document.getElementById('uc-enabled')?.checked === true,
    title: document.getElementById('uc-title')?.value.trim() || DEFAULTS.title,
    description: document.getElementById('uc-description')?.value.trim() || DEFAULTS.description,
    whatsapp_number: document.getElementById('uc-wa-number')?.value.trim() || '',
    whatsapp_message: document.getElementById('uc-wa-message')?.value.trim() || DEFAULTS.whatsapp_message,
    whatsapp_label: document.getElementById('uc-wa-label')?.value.trim() || DEFAULTS.whatsapp_label
  });

  function adminMarkup(settings) {
    return `<div id="uc-admin-panel" class="space-y-5">
      <div class="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-5"><div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><div class="text-[9px] font-black uppercase tracking-[.12em] text-amber-600">SITE CONTROL</div><h2 class="mt-1 text-lg sm:text-xl font-black text-[#151c75]">Under Construction</h2><p class="mt-1 text-[10px] sm:text-xs text-slate-500">Atur mode maintenance, copy, dan kontak WhatsApp dari satu tempat.</p></div><label class="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 cursor-pointer"><span class="text-xs font-black text-slate-700">Aktifkan Mode</span><input id="uc-enabled" type="checkbox" ${settings.enabled ? 'checked' : ''} class="w-5 h-5 accent-[#151c75]"></label></div></div>
      <section class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"><h3 class="text-sm font-black text-[#151c75]">Konten</h3>
        <label class="block"><span class="text-[10px] font-black text-slate-700">Judul</span><input id="uc-title" value="${esc(settings.title)}" maxlength="120" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none"></label>
        <label class="block"><span class="text-[10px] font-black text-slate-700">Deskripsi</span><textarea id="uc-description" rows="4" class="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.description)}</textarea></label>
      </section>
      <section class="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3"><h3 class="text-sm font-black text-[#151c75]">WhatsApp</h3>
        <input id="uc-wa-number" value="${esc(settings.whatsapp_number)}" placeholder="62812xxxx" inputmode="tel" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">
        <textarea id="uc-wa-message" rows="3" placeholder="Pesan WhatsApp" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">${esc(settings.whatsapp_message)}</textarea>
        <input id="uc-wa-label" value="${esc(settings.whatsapp_label)}" maxlength="60" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs outline-none">
      </section>
      <div class="flex flex-wrap gap-2"><button id="uc-save" type="button" class="rounded-xl bg-[#151c75] px-4 py-2.5 text-[10px] font-extrabold text-white">Simpan Perubahan</button><button id="uc-preview" type="button" class="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-[10px] font-extrabold text-[#151c75]">Preview</button></div>
    </div>`;
  }

  async function renderAdmin(target = document.getElementById('admin-content-area')) {
    if (!target) return;
    let settings = await getSettings();
    target.innerHTML = adminMarkup(settings);
    target.querySelector('#uc-save')?.addEventListener('click', async () => {
      try {
        settings = await saveSettings(readForm());
        await renderAdmin(target);
        toast('Pengaturan Under Construction tersimpan.', 'success');
      } catch (e) {
        toast(e.message || 'Pengaturan belum tersimpan.', 'error');
      }
    });
    target.querySelector('#uc-preview')?.addEventListener('click', () => {
      const preview = readForm();
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) { toast('Popup preview diblokir browser.', 'error'); return; }
      w.document.open();
      w.document.write('<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preview Under Construction</title></head><body></body></html>');
      w.document.close();
      renderPublic(w.document, preview);
    });
  }

  window.StudihomeUnderConstruction = Object.freeze({ getSettings, renderAdmin, renderPublic });

  async function boot() {
    try {
      for (let i = 0; i < 120 && !db()?.auth; i++) await new Promise(r => setTimeout(r, 50));
      const settings = await getSettings();

      // Public gate: ketika maintenance aktif, anonymous hanya boleh melihat halaman utama.
      if (settings.enabled && !ROOT && !AUTH_ROUTES.has(PATH)) {
        const gated = await enforcePublicGate(settings);
        if (gated) return;
      }

      // Maintenance page hanya untuk root; authenticated users/admin tetap bisa membuka area aplikasi.
      if (settings.enabled && ROOT) {
        const user = await getUser();
        if (!user) renderPublic(document, settings);
      }
    } catch (e) {
      console.warn('[Studihome Under Construction]', e?.message || e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else void boot();
})();
