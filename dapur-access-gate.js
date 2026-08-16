(()=>{
'use strict';
const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
const isRoot=()=>path()==='/dapur';
const isWorkspace=()=>/^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
const loadRuntime=()=>{if(window.__DapurEntryLoaded)return;window.__DapurEntryLoaded=true;const s=document.createElement('script');s.src='/dapur-entry.js?v=20260816access6';s.defer=true;s.onerror=()=>renderGate('Dapur belum dapat dimuat','Runtime Dapur gagal dimuat. Silakan coba lagi.');document.head.appendChild(s)};
const waitForDb=async()=>{for(let i=0;i<100;i++){if(window.supabaseClient?.auth)return window.supabaseClient;await new Promise(r=>setTimeout(r,50))}throw Error('Koneksi Studihome belum siap.')};
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const brand=`<header style="min-height:64px;border-bottom:1px solid rgba(227,232,243,.85);background:rgba(246,248,252,.94);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 max(14px,calc((100% - 1180px)/2));position:sticky;top:0;z-index:20"><a href="/dapur" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#151c75;font-size:26px;font-weight:900;letter-spacing:-.045em"><span style="font-size:30px;font-weight:900;line-height:1;background:linear-gradient(135deg,#EAB308 0%,#F59E0B 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">✦</span><span>Studihome</span></a></header>`;
const renderGate=(title,body)=>{const app=document.getElementById('app');if(!app)return;app.innerHTML=`${brand}<section style="min-height:58vh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif"><div style="width:min(520px,100%);padding:30px;border:1px solid #e3e8f3;border-radius:26px;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.08);text-align:center;color:#182238"><div style="display:inline-grid;place-items:center;width:56px;height:56px;border-radius:18px;background:#eef3ff;color:#151c75;font-size:24px;font-weight:900">✦</div><h1 style="margin:18px 0 0;color:#151c75;font-size:28px;letter-spacing:-.04em">${esc(title)}</h1><p style="margin:12px auto 0;max-width:440px;color:#64748b;font-size:14px;line-height:1.7">${esc(body)}</p><div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:22px"><button type="button" onclick="window.CreatorAuth?.open?.()" style="display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 17px;border:0;border-radius:13px;background:linear-gradient(135deg,#151c75,#3546b8);color:#fff;font-weight:800;cursor:pointer">Masuk / Daftar</button></div></div></section>`};
const renderPublicLogin=()=>{const app=document.getElementById('app');if(!app)return;app.innerHTML=`${brand}<section style="min-height:58vh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif"><div style="width:min(560px,100%);padding:34px;border:1px solid #e3e8f3;border-radius:28px;background:linear-gradient(145deg,#fff,#f8faff);box-shadow:0 18px 48px rgba(15,23,42,.08);text-align:center"><div style="display:inline-grid;place-items:center;width:58px;height:58px;border-radius:18px;background:#eef3ff;color:#151c75;font-size:25px;font-weight:900">✦</div><div style="margin-top:14px;color:#b45309;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase">Dapur Creator</div><h1 style="margin:7px 0 0;color:#151c75;font-size:30px;letter-spacing:-.04em">Punya skill? Bikin pelanggan lebih mudah menemukan kamu.</h1><p style="margin:12px auto 0;max-width:470px;color:#64748b;font-size:14px;line-height:1.7">Untuk menjadi Creator, kamu wajib menjadi member Studihome dan memiliki minimal satu produk Premium aktif. Setelah masuk, lengkapi profil, layanan, dan karya untuk proses review sebelum tampil ke publik.</p><div style="display:flex;flex-wrap:wrap;justify-content:center;gap:7px;margin:16px 0 0"><span style="padding:7px 10px;border-radius:999px;background:#eef3ff;color:#151c75;font-size:10px;font-weight:800">Member Studihome</span><span style="padding:7px 10px;border-radius:999px;background:#eef3ff;color:#151c75;font-size:10px;font-weight:800">Premium aktif</span><span style="padding:7px 10px;border-radius:999px;background:#eef3ff;color:#151c75;font-size:10px;font-weight:800">Profil lengkap</span></div><button type="button" onclick="window.CreatorAuth?.open?.()" style="margin-top:22px;display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:11px 20px;border:0;border-radius:14px;background:linear-gradient(135deg,#151c75,#3546b8);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 10px 22px rgba(21,28,117,.15)">Masuk / Daftar</button></div></section>`};
const provision=async db=>{let raw='';try{raw=sessionStorage.getItem('studihome_creator_provision')||'';sessionStorage.removeItem('studihome_creator_provision')}catch{}if(raw!=='1')return false;const {data:userData,error:userError}=await db.auth.getUser();if(userError)throw userError;if(!userData?.user?.id)return false;const {data:access,error:accessError}=await db.rpc('has_creator_workspace_access');if(accessError)throw accessError;if(access!==true)throw Error('Akun belum memiliki Premium aktif.');const {data:result,error}=await db.rpc('ensure_creator_draft');if(error)throw error;const username=String(result?.username||'').toLowerCase();if(!/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/.test(username))throw Error('Username Creator tidak valid.');location.replace('/dapur/'+encodeURIComponent(username));return true};
const resolveRootSession=async db=>{const {data:userData,error:userError}=await db.auth.getUser();if(userError)throw userError;const user=userData?.user||null;if(!user){return false}if(await provision(db))return true;const access=await db.rpc('has_creator_workspace_access');if(access.error)throw access.error;if(access.data===true){loadRuntime();return true}renderGate('Dapur Creator khusus Premium','Akses Creator membutuhkan Premium aktif. Beli produk Premium terlebih dahulu, lalu kembali ke Dapur Creator untuk mulai mengatur profil, layanan, dan karya.');return true};
const boot=async()=>{
  if(isRoot()){
    // Public-first: never replace the public entry with an infrastructure/auth error.
    renderPublicLogin();
    try{
      const db=await waitForDb();
      await resolveRootSession(db);
    }catch(e){
      console.warn('[Studihome Dapur] Public entry fallback:',e);
      // Keep the public shell and auth CTA visible. Security is enforced when the member workspace is requested.
    }
    return;
  }
  try{
    const db=await waitForDb();
    const {data:userData,error:userError}=await db.auth.getUser();
    if(userError)throw userError;
    const user=userData?.user||null;
    if(!isWorkspace()){loadRuntime();return}
    if(!user){renderGate('Masuk dulu, ya','Dapur Creator adalah ruang member. Silakan masuk atau daftar untuk melanjutkan.');return}
    const r=await db.rpc('has_creator_workspace_access');
    if(r.error)throw r.error;
    if(r.data===true){loadRuntime();return}
    renderGate('Dapur Creator khusus Premium','Akses Creator membutuhkan Premium aktif. Beli produk Premium terlebih dahulu, lalu kembali ke Dapur Creator untuk mulai mengatur profil, layanan, dan karya.');
  }catch(e){
    console.error('[Studihome Dapur Access Gate]',e);
    renderGate('Akses Dapur belum dapat diverifikasi','Kami tidak dapat memastikan status akun saat ini. Demi keamanan, workspace belum dibuka. Silakan coba lagi beberapa saat lagi.');
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
