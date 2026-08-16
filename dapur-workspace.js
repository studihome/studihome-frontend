(()=>{
  'use strict';

  const db=()=>window.supabaseClient||null;
  const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
  const isRoot=()=>path()==='/dapur';
  const isWorkspace=()=>/^\/dapur\/[a-z0-9][a-z0-9-]{2,39}$/i.test(path());
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const toast=(m,t='info')=>window.App?.ui?.toast?.(m,t);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const validSlug=v=>/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/i.test(v);

  let observer=null;
  let inFlight=false;

  async function client(){
    for(let i=0;i<120;i++){
      if(db()?.auth)return db();
      await sleep(50);
    }
    return null;
  }

  async function user(){
    const c=await client();
    if(!c)return null;
    const r=await c.auth.getUser();
    if(r.error)throw r.error;
    return r.data?.user||null;
  }

  async function access(){
    const c=await client();
    if(!c)return false;
    const r=await c.rpc('has_creator_workspace_access');
    if(r.error)throw r.error;
    return r.data===true;
  }

  async function admin(){
    const c=await client();
    if(!c)return false;
    const r=await c.rpc('is_admin');
    if(r.error)return false;
    return r.data===true;
  }

  async function own(){
    const c=await client();
    const u=await user();
    if(!c||!u)return null;
    const r=await c.from('creator_profiles')
      .select('id,username,display_name,bio,is_published,review_status,managed_by_studihome')
      .eq('user_id',u.id)
      .eq('managed_by_studihome',false)
      .order('updated_at',{ascending:false})
      .limit(1)
      .maybeSingle();
    if(r.error)throw r.error;
    return r.data||null;
  }

  function mainCta(){
    return document.querySelector('.copy .cta a.btn.primary')||document.querySelector('.copy .cta a.btn');
  }

  function ensurePublicLink(creator){
    if(!creator?.username)return;
    const href='/' + encodeURIComponent(String(creator.username).toLowerCase());
    const root=document.querySelector('.copy .cta');
    if(root){
      let a=root.querySelector('[data-dapur-public-link]');
      if(!a){
        a=document.createElement('a');
        a.setAttribute('data-dapur-public-link','1');
        a.className='btn';
        a.textContent='Lihat Dapur Publik';
        a.style.background='#fff';
        a.style.color='#151c75';
        root.appendChild(a);
      }
      a.href=href;
    }
    const canonical=document.querySelector('.canonical .url');
    if(canonical&&!canonical.querySelector('[data-dapur-public-link]')){
      const a=document.createElement('a');
      a.setAttribute('data-dapur-public-link','1');
      a.className='btn';
      a.href=href;
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.textContent='Lihat Publik';
      canonical.appendChild(a);
    }
  }

  function provisionFlag(){
    try{return sessionStorage.getItem('studihome_creator_provision')==='1'}catch{return false}
  }

  function clearProvisionFlag(){
    try{sessionStorage.removeItem('studihome_creator_provision')}catch{}
  }

  async function createCreator(){
    if(inFlight)return;
    inFlight=true;
    try{
      if(!(await access())){
        location.assign('/');
        return;
      }
      const c=await client();
      const u=await user();
      if(!c||!u)throw new Error('Sesi login belum siap.');

      const existing=await own();
      if(existing){
        clearProvisionFlag();
        location.assign(`/dapur/${encodeURIComponent(existing.username)}`);
        return;
      }

      const r=await c.rpc('ensure_creator_draft');
      if(r.error)throw r.error;
      const result=r.data||{};
      const username=String(result.username||'').trim().toLowerCase();
      if(!validSlug(username))throw new Error('Username Creator otomatis tidak valid.');

      clearProvisionFlag();
      toast('Dapur Creator berhasil dibuat.','success');
      location.assign(`/dapur/${encodeURIComponent(username)}`);
    }catch(e){
      console.warn('[Studihome Dapur Workspace]',e?.message||e);
      toast(e?.message||'Dapur belum bisa dibuat.','error');
    }finally{
      inFlight=false;
    }
  }

  function normalizeRootCTA(state,creator){
    const a=mainCta();
    if(!a)return;
    a.removeAttribute('onclick');

    if(state==='admin'){
      a.textContent='Manage Akun';
      a.href='/dapur/studihome';
      delete a.dataset.dapurAction;
      return;
    }

    if(state==='premium-existing'){
      a.textContent='Kelola Dapur Kamu';
      a.href=`/dapur/${encodeURIComponent(String(creator.username).toLowerCase())}`;
      a.dataset.dapurAction='workspace';
      ensurePublicLink(creator);
      return;
    }

    if(state==='premium-new'){
      a.textContent='Mulai Membuat Dapur';
      a.href='/dapur';
      a.dataset.dapurAction='create';
      if(a.dataset.dapurCreateBound!=='1'){
        a.addEventListener('click',e=>{
          e.preventDefault();
          void createCreator();
        });
        a.dataset.dapurCreateBound='1';
      }
      return;
    }

    if(state==='nonpremium'){
      a.textContent='Lihat Produk Premium';
      a.href='/';
      delete a.dataset.dapurAction;
    }
  }

  function injectUsernameButton(creator){
    if(!creator)return;
    const profileBtn=document.querySelector('[data-action="profile"]');
    if(!profileBtn||document.querySelector('[data-action="username"]'))return;
    const b=document.createElement('button');
    b.type='button';
    b.className=profileBtn.className;
    b.dataset.action='username';
    b.textContent='Ubah Username';
    profileBtn.parentNode?.appendChild(b);
    b.addEventListener('click',()=>openUsernameEditor(creator));
    ensurePublicLink(creator);
  }

  function openUsernameEditor(creator){
    const old=document.getElementById('dapur-username-modal');
    if(old)old.remove();
    const overlay=document.createElement('div');
    overlay.id='dapur-username-modal';
    overlay.innerHTML=`<div style="position:fixed;inset:0;z-index:700;display:grid;place-items:center;padding:16px;background:rgba(7,16,77,.55);backdrop-filter:blur(8px)"><form style="width:min(520px,100%);padding:22px;border:1px solid #e3e8f3;border-radius:24px;background:#fff;box-shadow:0 30px 80px rgba(15,23,42,.25)"><div style="font-size:11px;font-weight:900;color:#d97706;text-transform:uppercase;letter-spacing:.08em">Profil Creator</div><h2 style="margin:8px 0 0;color:#151c75;font-size:24px">Ubah Username</h2><p style="margin:7px 0 0;color:#64748b;font-size:13px;line-height:1.6">Username menjadi alamat publikmu. Mengubahnya akan mengubah URL publik Creator.</p><label style="display:block;margin-top:16px"><span style="display:block;margin-bottom:7px;font-size:12px;font-weight:900;color:#334155">Username</span><input id="dapur-username-input" value="${esc(creator.username)}" autocomplete="off" spellcheck="false" style="width:100%;min-height:48px;padding:11px 13px;border:1px solid #d6dfef;border-radius:14px;font-size:16px;outline:0"></label><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button type="button" id="dapur-username-cancel" style="min-height:42px;padding:10px 15px;border:1px solid #dbe3ef;border-radius:13px;background:#fff;color:#334155;font-weight:900">Batal</button><button type="submit" id="dapur-username-save" style="min-height:42px;padding:10px 15px;border:0;border-radius:13px;background:linear-gradient(135deg,#151c75,#3546b8);color:#fff;font-weight:900">Simpan</button></div></form></div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#dapur-username-cancel').onclick=()=>overlay.remove();
    overlay.addEventListener('click',e=>{if(e.target===overlay.firstElementChild)overlay.remove()});

    overlay.querySelector('form').addEventListener('submit',async e=>{
      e.preventDefault();
      const btn=overlay.querySelector('#dapur-username-save');
      const next=String(overlay.querySelector('#dapur-username-input').value||'').trim().toLowerCase();
      if(!validSlug(next)){
        toast('Username 3–40 karakter: huruf kecil, angka, dan tanda hubung.','error');
        return;
      }
      if(next===String(creator.username||'').toLowerCase()){
        overlay.remove();
        return;
      }
      btn.disabled=true;
      try{
        const c=await client();
        if(!c)throw new Error('Koneksi Studihome belum siap.');
        const q=await c.from('creator_profiles')
          .select('id')
          .ilike('username',next)
          .neq('id',creator.id)
          .limit(1)
          .maybeSingle();
        if(q.error)throw q.error;
        if(q.data)throw new Error('Username sudah dipakai. Pilih nama lain.');

        const u=await c.from('creator_profiles').update({username:next}).eq('id',creator.id);
        if(u.error)throw u.error;

        overlay.remove();
        toast('Username berhasil diperbarui.','success');
        location.assign(`/dapur/${encodeURIComponent(next)}`);
      }catch(err){
        toast(err?.message||'Username belum bisa diperbarui.','error');
      }finally{btn.disabled=false}
    });
  }

  async function sync(){
    if(inFlight)return;
    const c=await client();
    if(!c)return;

    if(isRoot()){
      try{
        const u=await user();
        if(!u)return;

        if(await admin()){
          normalizeRootCTA('admin',null);
          return;
        }

        const allowed=await access();
        if(!allowed){
          normalizeRootCTA('nonpremium',null);
          return;
        }

        const creator=await own();
        if(creator){
          clearProvisionFlag();
          normalizeRootCTA('premium-existing',creator);
          return;
        }

        normalizeRootCTA('premium-new',null);
        if(provisionFlag()){
          clearProvisionFlag();
          await createCreator();
        }
      }catch(e){
        console.warn('[Studihome Dapur Workspace]',e?.message||e);
      }
    }else if(isWorkspace()){
      try{
        const creator=await own();
        injectUsernameButton(creator);
      }catch(e){
        console.warn('[Studihome Dapur Workspace]',e?.message||e);
      }
    }
  }

  function boot(){
    if(!observer&&document.body){
      observer=new MutationObserver(()=>{
        if(isRoot()||isWorkspace())void sync();
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
    void sync();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
