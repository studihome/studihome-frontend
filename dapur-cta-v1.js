(()=>{'use strict';
  const db=()=>window.supabaseClient;
  const path=()=>((location.pathname||'/').replace(/\/+$/,'')||'/');
  const root=()=>path()==='/dapur';
  const slug=()=>{const m=path().match(/^\/dapur\/([a-z0-9][a-z0-9-]{2,39})$/i);return m?m[1].toLowerCase():''};
  const own=async user=>{if(!db()||!user)return null;const{data,error}=await db().from('creator_profiles').select('username,display_name').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(1);if(error)return null;return data?.[0]||null};
  const mark=(a,href,text)=>{a.href=href;a.textContent=text;a.dataset.dapurCta='1';};
  async function boot(){
    if(!db())return;
    let user=null;try{const r=await db().auth.getUser();user=r.data?.user||null}catch{return}
    const creator=await own(user);
    if(root()){
      document.querySelectorAll('a[href="/kamar"]').forEach(a=>{
        const label=(a.textContent||'').trim().toLowerCase();
        if(!label.includes('buat dapur'))return;
        if(creator)mark(a,`/dapur/${encodeURIComponent(creator.username)}`,'Kelola Dapurku');
        else a.href='/kamar?next=%2Fdapur&intent=creator';
      });
    }else if(slug()){
      document.querySelectorAll('a[href="/kamar"]').forEach(a=>{
        const label=(a.textContent||'').trim().toLowerCase();
        if(!label.includes('buat dapur')&&!label.includes('masuk / daftar'))return;
        if(user)mark(a,`/${encodeURIComponent(slug())}`,'Lihat Profil Publik');
        else a.href=`/kamar?next=%2Fdapur%2F${encodeURIComponent(slug())}&intent=creator`;
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
