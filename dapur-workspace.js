(()=>{
  'use strict';
  const db=()=>window.supabaseClient||null;
  const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
  const isRoot=()=>path()==='/dapur';
  const isWorkspace=()=>/^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const toast=(m,t='info')=>window.App?.ui?.toast?.(m,t);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const slugify=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40);
  const validSlug=v=>/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/i.test(v);
  let observer=null,inFlight=false;

  async function client(){for(let i=0;i<120;i++){if(db()?.auth)return db();await sleep(50)}return null}
  async function user(){const c=await client();if(!c)return null;const r=await c.auth.getUser();if(r.error)throw r.error;return r.data?.user||null}
  async function access(){const c=await client();if(!c)return false;const r=await c.rpc('has_creator_workspace_access');if(r.error)throw r.error;return r.data===true}
  async function own(){const c=await client();const u=await user();if(!c||!u)return null;const r=await c.from('creator_profiles').select('id,username,display_name,bio,is_published,review_status').eq('user_id',u.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();if(r.error)throw r.error;return r.data||null}

  function mainCta(){return document.querySelector('.copy .cta a.btn.primary')||document.querySelector('.copy .cta a.btn')}
  function ensurePublicLink(creator){
    if(!creator?.username)return;
    const href='/' + encodeURIComponent(String(creator.username).toLowerCase());
    const root=document.querySelector('.copy .cta');
    if(root){
      let a=root.querySelector('[data-dapur-public-link]');
      if(!a){a=document.createElement('a');a.setAttribute('data-dapur-public-link','1');a.className='btn';a.href=href;a.textContent='Lihat Dapur Publik';a.style.background='#fff';a.style.color='#151c75';root.appendChild(a)}else{a.href=href}
    }
    const canonical=document.querySelector('.canonical .url');
    if(canonical&&!canonical.querySelector('[data-dapur-public-link]')){
      const a=document.createElement('a');a.setAttribute('data-dapur-public-link','1');a.className='btn';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Lihat Publik';canonical.appendChild(a)
    }
  }

  function profileName(u){return String(u?.user_metadata?.full_name||u?.user_metadata?.name||u?.user_metadata?.display_name||'').trim()}
  async function makeSlug(u){
    const c=await client();
    let base=slugify(profileName(u)||String(u?.email||'').split('@')[0]||'creator');
    if(base.length<3)base='creator-'+String(u.id||'').replace(/[^a-z0-9]/gi,'').slice(0,8);
    if(!validSlug(base))base='creator-'+String(u.id||'').replace(/[^a-z0-9]/gi,'').slice(0,8);
    for(let n=0;n<100;n++){
      const candidate=(n===0?base:`${base.slice(0,Math.max(3,36-String(n).length-1))}-${n+1}`).replace(/-+$/,'');
      const v=await c.rpc('validate_creator_username',{p_username:candidate});
      if(v.error)continue;
      const q=await c.from('creator_profiles').select('id').ilike('username',candidate).limit(1).maybeSingle();
      if(q.error)throw q.error;
      if(!q.data)return candidate;
    }
    throw new Error('Username otomatis belum tersedia. Coba lagi dengan nama yang berbeda.');
  }

  async function createCreator(){
    if(inFlight)return;
    inFlight=true;
    try{
      if(!(await access())){location.href='/';return}
      const c=await client(),u=await user();if(!c||!u)throw new Error('Sesi login belum siap.');
      const existing=await own();if(existing){window.Dapur?.boot?.();return}
      const username=await makeSlug(u);
      const name=profileName(u)||String(u.email||'').split('@')[0]||username;
      const r=await c.from('creator_profiles').insert({user_id:u.id,username,display_name:name,bio:'',avatar_url:'',cover_url:'',whatsapp:'',location:'',is_published:false,is_verified:false,review_status:'DRAFT',contact_email:''}).select('id,username').single();
      if(r.error)throw r.error;
      toast('Dapur Creator berhasil dibuat. Username awalmu sudah disiapkan.','success');
      history.replaceState({},'', '/dapur');
      await window.Dapur?.boot?.();
    }catch(e){toast(e?.message||'Dapur belum bisa dibuat.','error')}finally{inFlight=false}
  }

  function normalizeRootCTA(state,creator){
    const a=mainCta();if(!a)return;
    a.removeAttribute('onclick');
    if(state==='premium-existing'){
      a.textContent='Kelola Dapur';a.href='/dapur';a.dataset.dapurAction='workspace';ensurePublicLink(creator);
    }else if(state==='premium-new'){
      a.textContent='Mulai Membuat Dapur';a.href='/dapur';a.dataset.dapurAction='create';
      if(a.dataset.dapurCreateBound!=='1'){a.addEventListener('click',e=>{e.preventDefault();void createCreator()});a.dataset.dapurCreateBound='1'}
    }else if(state==='nonpremium'){
      a.textContent='Lihat Produk Premium';a.href='/';
    }
  }

  function injectUsernameButton(creator){
    if(!creator)return;
    const profileBtn=document.querySelector('[data-action="profile"]');
    if(!profileBtn||document.querySelector('[data-action="username"]'))return;
    const b=document.createElement('button');b.type='button';b.className=profileBtn.className;b.dataset.action='username';b.textContent='Ubah Username';profileBtn.parentNode?.appendChild(b);
    b.addEventListener('click',()=>openUsernameEditor(creator));
    ensurePublicLink(creator);
  }

  function openUsernameEditor(creator){
    const old=document.getElementById('dapur-username-modal');if(old)old.remove();
    const overlay=document.createElement('div');overlay.id='dapur-username-modal';overlay.innerHTML=`<div style="position:fixed;inset:0;z-index:700;display:grid;place-items:center;padding:16px;background:rgba(7,16,77,.55);backdrop-filter:blur(8px)"><form style="width:min(520px,100%);padding:22px;border:1px solid #e3e8f3;border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(15,23,42,.25)"><div style="font-size:11px;font-weight:900;color:#d97706;text-transform:uppercase;letter-spacing:.08em">Profil Creator</div><h2 style="margin:8px 0 0;color:#151c75;font-size:24px">Ubah Username</h2><p style="margin:7px 0 0;color:#64748b;font-size:13px;line-height:1.6">Username menjadi alamat publikmu. Mengubahnya akan mengubah URL publik Creator.</p><label style="display:block;margin-top:16px"><span style="display:block;margin-bottom:7px;font-size:12px;font-weight:900;color:#334155">Username</span><input id="dapur-username-input" value="${esc(creator.username)}" autocomplete="off" spellcheck="false" style="width:100%;min-height:48px;padding:11px 13px;border:1px solid #d6dfef;border-radius:14px;font-size:16px;outline:0"></label><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button type="button" id="dapur-username-cancel" style="min-height:42px;padding:10px 15px;border:1px solid #dbe3ef;border-radius:13px;background:#fff;color:#334155;font-weight:900">Batal</button><button type="submit" id="dapur-username-save" style="min-height:42px;padding:10px 15px;border:0;border-radius:13px;background:linear-gradient(135deg,#151c75,#3546b8);color:#fff;font-weight:900">Simpan</button></div></form></div>`;
    document.body.appendChild(overlay);overlay.querySelector('#dapur-username-cancel').onclick=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay.firstElementChild)overlay.remove()});
    overlay.querySelector('form').addEventListener('submit',async e=>{e.preventDefault();const btn=overlay.querySelector('#dapur-username-save');const next=String(overlay.querySelector('#dapur-username-input').value||'').trim().toLowerCase();if(!validSlug(next)){toast('Username 3–40 karakter: huruf kecil, angka, dan tanda hubung.','error');return}btn.disabled=true;try{const c=await client();const v=await c.rpc('validate_creator_username',{p_username:next});if(v.error)throw v.error;const q=await c.from('creator_profiles').select('id').ilike('username',next).neq('id',creator.id).limit(1).maybeSingle();if(q.error)throw q.error;if(q.data)throw new Error('Username sudah dipakai. Pilih nama lain.');const u=await c.from('creator_profiles').update({username:next}).eq('id',creator.id);if(u.error)throw u.error;overlay.remove();toast('Username berhasil diperbarui.','success');await window.Dapur?.boot?.()}catch(err){toast(err?.message||'Username belum bisa diperbarui.','error')}finally{btn.disabled=false}});
  }

  async function sync(){
    if(inFlight)return;
    const c=await client();if(!c)return;
    if(isRoot()){
      try{
        const u=await user();
        if(!u){return}
        const allowed=await access();
        if(!allowed){normalizeRootCTA('nonpremium',null);return}
        const creator=await own();
        if(creator)normalizeRootCTA('premium-existing',creator);else normalizeRootCTA('premium-new',null);
      }catch(e){console.warn('[Studihome Dapur Workspace]',e?.message||e)}
    }else if(isWorkspace()){
      try{const creator=await own();injectUsernameButton(creator)}catch(e){console.warn('[Studihome Dapur Workspace]',e?.message||e)}
    }
  }

  function boot(){
    if(!observer&&document.body){observer=new MutationObserver(()=>{if(isRoot()||isWorkspace())sync()});observer.observe(document.body,{childList:true,subtree:true})}
    void sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
