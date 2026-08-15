(() => {
  'use strict';
  const S=()=>window.supabaseClient;
  const esc=v=>window.App?.utils?.escapeHtml?window.App.utils.escapeHtml(v):String(v??'');
  const toast=(m,t='info')=>window.App?.ui?.toast?.(m,t);
  const refresh=()=>window.AdminDapur?.render?.();
  async function creator(id){const {data,error}=await S().from('creator_profiles').select('*').eq('id',id).eq('managed_by_studihome',true).maybeSingle();if(error)throw error;if(!data)throw new Error('Creator managed tidak ditemukan.');return data;}
  async function editCategories(id){
    try{
      const [{data:cats,error:ce},{data:current,error:ke}]=await Promise.all([
        S().from('ai_categories').select('id,name,slug').eq('is_active',true).order('name'),
        S().from('creator_category_members').select('category_id,is_primary').eq('creator_id',id)
      ]);if(ce)throw ce;if(ke)throw ke;
      const currentIds=new Set((current||[]).map(x=>x.category_id));
      const menu=(cats||[]).map((c,i)=>`${i+1}. ${c.name} [${c.slug}]${currentIds.has(c.id)?' ✓':''}`).join('\n');
      const raw=prompt('Pilih Menu (kategori) dengan nomor dipisahkan koma. Contoh: 1,3,5\n\n'+menu, (cats||[]).map((c,i)=>currentIds.has(c.id)?i+1:'').filter(Boolean).join(','));
      if(raw===null)return;
      const nums=[...new Set(raw.split(',').map(x=>parseInt(x.trim(),10)).filter(n=>Number.isInteger(n)&&n>=1&&n<=(cats||[]).length))];
      if(!nums.length)throw new Error('Minimal pilih 1 kategori.');
      const selected=nums.map(n=>cats[n-1]);
      const {error:delErr}=await S().from('creator_category_members').delete().eq('creator_id',id);if(delErr)throw delErr;
      const rows=selected.map((c,i)=>({creator_id:id,category_id:c.id,is_primary:i===0}));
      const {error:insErr}=await S().from('creator_category_members').insert(rows);if(insErr)throw insErr;
      toast('Menu Creator diperbarui.','success'); await refresh();
    }catch(e){toast(e.message||'Menu belum bisa diperbarui.','error');}
  }
  async function addService(creatorId){
    try{
      const title=prompt('Nama Hidangan / Jasa:');if(title===null)return;
      const description=prompt('Deskripsi singkat:','');if(description===null)return;
      const from=prompt('Harga mulai:','0');if(from===null)return;
      const to=prompt('Harga sampai:','0');if(to===null)return;
      const days=prompt('Estimasi hari pengerjaan:','3');if(days===null)return;
      const {error}=await S().from('creator_services').insert({creator_id:creatorId,title:title.trim(),description:description.trim(),price_from:Number(from)||0,price_to:Number(to)||0,delivery_days:Math.max(1,parseInt(days,10)||1),is_active:true});
      if(error)throw error;toast('Hidangan baru ditambahkan.','success');await refresh();
    }catch(e){toast(e.message||'Hidangan belum bisa ditambahkan.','error');}
  }
  async function editService(id){
    try{
      const {data:s,error}=await S().from('creator_services').select('*').eq('id',id).maybeSingle();if(error)throw error;if(!s)throw new Error('Hidangan tidak ditemukan.');
      const title=prompt('Nama Hidangan:',s.title||'');if(title===null)return;
      const desc=prompt('Deskripsi:',s.description||'');if(desc===null)return;
      const from=prompt('Harga mulai:',String(s.price_from));if(from===null)return;
      const to=prompt('Harga sampai:',String(s.price_to));if(to===null)return;
      const days=prompt('Estimasi hari:',String(s.delivery_days));if(days===null)return;
      const active=confirm('OK = Hidangan AKTIF, Cancel = Hidangan NONAKTIF');
      const {error:ue}=await S().from('creator_services').update({title:title.trim(),description:desc.trim(),price_from:Number(from)||0,price_to:Number(to)||0,delivery_days:Math.max(1,parseInt(days,10)||1),is_active:active}).eq('id',id);if(ue)throw ue;
      toast('Hidangan diperbarui.','success');await refresh();
    }catch(e){toast(e.message||'Hidangan belum bisa diperbarui.','error');}
  }
  function detect(url){
    try{const u=new URL(String(url||'').trim());const h=u.hostname.toLowerCase(),p=u.pathname.toLowerCase();if(/(^|\.)youtube\.com$/.test(h)||h==='youtu.be')return'youtube';if(/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(h))return'drive';if(/(^|\.)tiktok\.com$/.test(h))return'tiktok';if(/(^|\.)instagram\.com$/.test(h))return'instagram';if(/\.(png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(p))return'image';if(/\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i.test(p))return'video';return'link';}catch{return null;}}
  async function addPortfolio(creatorId){
    try{
      const title=prompt('Judul Ambalan / Portfolio:');if(title===null)return;
      const desc=prompt('Deskripsi:','');if(desc===null)return;
      const url=prompt('Tautan Media:');if(url===null)return;
      const type=detect(url);if(!type)throw new Error('Tautan media tidak valid.');
      const {error}=await S().from('creator_portfolios').insert({creator_id:creatorId,title:title.trim(),description:desc.trim(),media_type:type,media_url:url.trim(),sort_order:0,is_active:true});if(error)throw error;
      toast('Ambalan baru ditambahkan.','success');await refresh();
    }catch(e){toast(e.message||'Ambalan belum bisa ditambahkan.','error');}
  }
  async function editPortfolio(id){
    try{
      const {data:p,error}=await S().from('creator_portfolios').select('*').eq('id',id).maybeSingle();if(error)throw error;if(!p)throw new Error('Ambalan tidak ditemukan.');
      const title=prompt('Judul Ambalan:',p.title||'');if(title===null)return;
      const desc=prompt('Deskripsi:',p.description||'');if(desc===null)return;
      const url=prompt('Tautan Media:',p.media_url||'');if(url===null)return;
      const type=detect(url);if(!type)throw new Error('Tautan media tidak valid.');
      const active=confirm('OK = Ambalan AKTIF, Cancel = Ambalan NONAKTIF');
      const {error:ue}=await S().from('creator_portfolios').update({title:title.trim(),description:desc.trim(),media_type:type,media_url:url.trim(),is_active:active}).eq('id',id);if(ue)throw ue;
      toast('Ambalan diperbarui.','success');await refresh();
    }catch(e){toast(e.message||'Ambalan belum bisa diperbarui.','error');}
  }
  async function createCreator(){
    try{
      const p=window.App?.state?.user;
      if(!p?.id)throw new Error('Session Admin belum siap.');
      const username=prompt('Username Creator (slug, 3–40 karakter):');if(username===null)return;
      const displayName=prompt('Nama tampilan Creator:');if(displayName===null)return;
      const email=prompt('Email kontak Creator (opsional):',(p.email||''));if(email===null)return;
      const {error}=await S().from('creator_profiles').insert({user_id:p.id,username:username.trim().toLowerCase(),display_name:displayName.trim(),bio:'',avatar_url:'',cover_url:'',whatsapp:'',location:'',is_published:false,is_verified:false,review_status:'DRAFT',managed_by_studihome:true,is_studihome_official:false,contact_email:email.trim()});
      if(error)throw error;toast('Creator managed baru berhasil dibuat.','success');await refresh();
    }catch(e){toast(e.message||'Creator baru belum bisa dibuat.','error');}
  }
  window.AdminDapur=Object.assign(window.AdminDapur||{},{editCategories,addService,editService,addPortfolio,editPortfolio,createCreator});
})();
