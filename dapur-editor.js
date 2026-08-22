(()=> {
  'use strict';
  const S=()=>window.supabaseClient;
  const esc=v=>window.App?.utils?.escapeHtml?window.App.utils.escapeHtml(v):String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,t='info')=>window.App?.ui?.toast?.(m,t);
  let modal=null;
  const get=id=>document.getElementById(id);
  const styleId='dapur-editor-style';
  const css=`.de-overlay{position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(15,23,42,.6);backdrop-filter:blur(12px) saturate(180%)}.de-modal{width:min(760px,94vw);max-height:92dvh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;border-radius:28px;background:#fff;box-shadow:0 25px 60px rgba(15,23,42,.2)}.de-head{display:flex;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid #f1f5f9;background:linear-gradient(180deg,#fafbff 0%,#fff 100%)}.de-kicker{display:inline-flex;padding:6px 10px;border-radius:999px;background:#eef2ff;border:1px solid #e0e7ff;color:#6366f1;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.de-head h2{margin:10px 0 0;color:#0f172a;font-size:22px;letter-spacing:-.025em;font-weight:900}.de-head p{margin:5px 0 0;color:#64748b;font-size:12px;line-height:1.6}.de-close{width:42px;height:42px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#64748b;font-size:20px;cursor:pointer;transition:all .15s ease}.de-close:hover{background:#f8fafc;border-color:#cbd5e1}.de-form{padding:24px;overflow:auto}.de-field{display:block;margin-bottom:18px}.de-label{display:block;margin-bottom:8px;color:#1e293b;font-size:14px;font-weight:800}.de-hint{display:block;margin-top:4px;color:#94a3b8;font-weight:500;font-size:11px;line-height:1.5}.de-input,.de-textarea{width:100%;min-height:52px;padding:14px 16px;border:1.5px solid #e2e8f0;border-radius:16px;background:#fff;color:#0f172a;font-size:16px;outline:0;transition:all .2s cubic-bezier(.4,0,.2,1)}.de-textarea{min-height:140px;resize:vertical;line-height:1.6}.de-input:focus,.de-textarea:focus{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.1)}.de-input:disabled{background:#f8fafc;color:#94a3b8;cursor:not-allowed}.de-check{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px;border:1.5px solid #e2e8f0;border-radius:18px;background:#fff;transition:all .15s ease}.de-check:hover{border-color:#c7d2fe}.de-check b{display:block;color:#1e293b;font-size:14px;font-weight:800}.de-check span{display:block;margin-top:3px;color:#94a3b8;font-size:11px;line-height:1.5}.de-check input{width:22px;height:22px;accent-color:#6366f1}.de-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.de-cat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.de-cat{display:flex;align-items:center;gap:10px;padding:14px;border:1.5px solid #e2e8f0;border-radius:16px;background:#f8fafc;cursor:pointer;transition:all .15s ease}.de-cat:hover{border-color:#c7d2fe;background:#f5f3ff}.de-cat.selected{border-color:#6366f1;background:#eef2ff}.de-cat input{width:20px;height:20px;accent-color:#6366f1}.de-cat span{color:#1e293b;font-size:13px;font-weight:800}.de-tip{margin-bottom:18px;padding:14px 16px;border:1px solid #e0e7ff;border-radius:16px;background:#f5f3ff;color:#475569;font-size:12px;line-height:1.6}.de-list{display:grid;gap:10px;margin:0 0 18px}.de-list-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}.de-list-title{color:#0f172a;font-size:15px;font-weight:900}.de-list-note{color:#94a3b8;font-size:11px}.de-item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border:1.5px solid #e2e8f0;border-radius:18px;background:#f8fafc;transition:all .15s ease}.de-item:hover{border-color:#c7d2fe}.de-item-main{min-width:0}.de-item-title{color:#0f172a;font-size:14px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.de-item-desc{margin-top:3px;color:#64748b;font-size:11px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.de-item-meta{margin-top:5px;color:#94a3b8;font-size:10px}.de-item-actions{display:flex;gap:6px;flex:0 0 auto}.de-mini{min-height:38px;padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:12px;background:#fff;color:#334155;font-size:11px;font-weight:800;cursor:pointer;transition:all .15s ease}.de-mini:hover{background:#f8fafc;border-color:#c7d2fe}.de-mini.danger{border-color:#fecaca;background:#fef2f2;color:#dc2626}.de-mini.danger:hover{background:#fee2e2}.de-avatar{display:flex;align-items:center;gap:14px;margin:0 0 18px;padding:16px;border:1.5px solid #e2e8f0;border-radius:18px;background:#f8fafc}.de-avatar-preview{width:68px;height:68px;border-radius:20px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#e0e7ff,#c7d2fe);color:#6366f1;font-size:24px;font-weight:900;flex:none}.de-avatar-preview img{width:100%;height:100%;object-fit:cover}.de-file{font-size:12px}.de-file input{display:block;margin-top:8px;width:100%;font-size:13px}.de-file small{display:block;margin-top:6px;color:#94a3b8;line-height:1.5}.de-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:16px 24px;border-top:1px solid #f1f5f9;background:#fafbff}.de-actions{display:flex;gap:8px}.de-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:12px 18px;border:1.5px solid #e2e8f0;border-radius:14px;background:#fff;color:#334155;font-size:13px;font-weight:800;cursor:pointer;transition:all .15s ease}.de-btn:hover{background:#f8fafc;border-color:#c7d2fe}.de-btn.primary{color:#fff;border-color:transparent;background:linear-gradient(135deg,#6366f1,#4f46e5);box-shadow:0 4px 12px rgba(99,102,241,.2)}.de-btn.primary:hover{box-shadow:0 6px 16px rgba(99,102,241,.3)}.de-btn:disabled{opacity:.5;cursor:not-allowed}.de-loading{position:fixed;inset:0;z-index:600;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.45);backdrop-filter:blur(8px)}.de-loading-box{display:flex;flex-direction:column;align-items:center;gap:14px;padding:32px 40px;border-radius:22px;background:#fff;box-shadow:0 24px 60px rgba(15,23,42,.18)}.de-spinner{width:44px;height:44px;border:3px solid #e2e8f0;border-top-color:#6366f1;border-radius:50%;animation:deSpin .7s linear infinite}.de-loading-text{color:#334155;font-size:14px;font-weight:800}.de-loading-sub{color:#94a3b8;font-size:12px}.de-cat-primary{display:flex;flex-direction:column;gap:6px;margin-top:12px;padding:14px;border:1.5px solid #e0e7ff;border-radius:16px;background:#f5f3ff}.de-cat-primary label{color:#475569;font-size:12px;font-weight:700}.de-cat-primary select{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:14px;background:#fff;color:#0f172a;font-size:14px;font-weight:600;outline:0;cursor:pointer}.de-cat-primary select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.de-cat-count{text-align:center;margin-top:10px;color:#94a3b8;font-size:11px;font-weight:700}.de-cat-count strong{color:#6366f1}.de-admin-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#fef3c7;border:1px solid #fde68a;color:#92400e;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em}.de-admin-select{margin-bottom:18px;padding:14px;border:1.5px solid #e2e8f0;border-radius:18px;background:#f8fafc}.de-admin-select label{display:block;margin-bottom:8px;color:#1e293b;font-size:14px;font-weight:800}.de-admin-select select{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:14px;background:#fff;color:#0f172a;font-size:15px;font-weight:600;outline:0;cursor:pointer}.de-admin-select select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}@keyframes deSpin{to{transform:rotate(360deg)}}@media(max-width:768px){.de-grid,.de-cat-grid{grid-template-columns:1fr}.de-footer{flex-direction:column;align-items:stretch}.de-footer .de-actions{flex-direction:column}.de-footer .de-actions>*{width:100%}.de-head{padding:16px 18px}.de-head h2{font-size:19px}.de-head p{font-size:11px}.de-form{padding:18px}.de-label{font-size:14px}.de-hint{font-size:11px}.de-input,.de-textarea{min-height:52px;padding:14px}.de-textarea{min-height:130px}.de-btn{min-height:48px}.de-check{padding:14px}.de-modal{border-radius:24px 24px 0 0;max-height:95dvh}.de-item{align-items:flex-start;flex-direction:column;gap:10px}.de-item-actions{width:100%}.de-item-actions>*{flex:1;text-align:center}.de-avatar{align-items:flex-start;gap:12px;padding:14px}.de-avatar-preview{width:60px;height:60px;border-radius:18px}.de-cat-primary{flex-direction:column;align-items:stretch}}@media(max-width:480px){.de-overlay{padding:0;align-items:flex-end}.de-modal{border-radius:24px 24px 0 0;max-height:98dvh;width:100%}.de-head{padding:14px 16px}.de-form{padding:16px}.de-footer{padding:14px 16px}}@media(prefers-reduced-motion:reduce){.de-input,.de-textarea,.de-btn,.de-item,.de-cat,.de-spinner{transition:none;animation:none}}`;
  function ensureStyle(){if(document.getElementById(styleId))return;const s=document.createElement('style');s.id=styleId;s.textContent=css;document.head.appendChild(s)}
  function close(){if(modal){modal.remove();modal=null}}
  function field(name,label,value='',type='text',hint='',attrs=''){return '<label class="de-field"><span class="de-label"><span>'+esc(label)+'</span>'+(hint?'<span class="de-hint">'+esc(hint)+'</span>':'')+'</span><input class="de-input" name="'+esc(name)+'" type="'+esc(type)+'" value="'+esc(value)+'" '+attrs+'></label>'}
  function area(name,label,value='',hint=''){return '<label class="de-field"><span class="de-label"><span>'+esc(label)+'</span>'+(hint?'<span class="de-hint">'+esc(hint)+'</span>':'')+'</span><textarea class="de-textarea" name="'+esc(name)+'">'+esc(value)+'</textarea></label>'}
  function check(name,label,value,help=''){return '<label class="de-check"><span><b>'+esc(label)+'</b><span>'+esc(help)+'</span></span><input name="'+esc(name)+'" type="checkbox" '+(value?'checked':'')+'></label>'}
  function showLoading(msg,sub){if(get('de-loading'))return;const d=document.createElement('div');d.id='de-loading';d.className='de-loading';d.innerHTML='<div class="de-loading-box"><div class="de-spinner"></div><div class="de-loading-text">'+esc(msg||'Menyimpan…')+'</div><div class="de-loading-sub">'+esc(sub||'Tunggu sebentar ya.')+'</div></div>';document.body.appendChild(d)}
  function hideLoading(){const el=get('de-loading');if(el)el.remove()}
  function shell(title,subtitle,body,onSave){
    ensureStyle();
    close();
    modal=document.createElement('div');
    modal.className='de-overlay';
    var html='<div class="de-modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">';
    html+='<header class="de-head"><div><span class="de-kicker">Dapur Studihome</span><h2>'+esc(title)+'</h2><p>'+esc(subtitle)+'</p></div>';
    html+='<button class="de-close" type="button" id="de-close" aria-label="Tutup">×</button></header>';
    html+='<form id="de-form">';
    html+=body;
    html+='<footer class="de-footer"><span id="de-state" style="font-size:11px;color:#64748b">Belum ada perubahan.</span>';
    html+='<div class="de-actions"><button type="button" class="de-btn" id="de-cancel">Batal</button>';
    html+='<button type="submit" class="de-btn primary" id="de-save">💾 Simpan Perubahan</button></div></footer>';
    html+='</form></div>';
    modal.innerHTML=html;
    document.body.appendChild(modal);
    var form=document.getElementById('de-form');
    var saveBtn=document.getElementById('de-save');
    var stateEl=document.getElementById('de-state');
    var state='IDLE';
    function transition(next){
      state=next;
      if(form)form.dataset.state=next;
      if(stateEl){
        var msgs={IDLE:'Belum ada perubahan.',DIRTY:'✨ Perubahan belum disimpan.',SAVING:'⏳ Menyimpan…',SUCCESS:'✅ Berhasil disimpan!',ERROR:'❌ Gagal menyimpan.'};
        stateEl.textContent=msgs[next]||msgs.IDLE;
      }
      if(saveBtn){
        saveBtn.disabled=(next==='SAVING');
        saveBtn.textContent=(next==='SAVING')?'⏳ Menyimpan…':(next==='SUCCESS')?'✅ Tersimpan!':'💾 Simpan Perubahan';
      }
    }
    function markDirty(){if(state==='IDLE'||state==='SUCCESS'||state==='ERROR')transition('DIRTY')}
    if(form){form.addEventListener('input',markDirty,{passive:true});form.addEventListener('change',markDirty,{passive:true})}
    function requestClose(e){
      if(state==='SAVING'){e.preventDefault();e.stopPropagation();toast('Sabar ya, lagi proses simpan!','info');return}
      if(state==='DIRTY'&&!window.confirm('Perubahan belum disimpan. Yakin tutup?')){e.preventDefault();e.stopPropagation();return}
      close();
    }
    var closeBtn=document.getElementById('de-close');
    var cancelBtn=document.getElementById('de-cancel');
    if(closeBtn)closeBtn.addEventListener('click',requestClose);
    if(cancelBtn)cancelBtn.addEventListener('click',requestClose);
    if(modal)modal.addEventListener('click',function(e){
      if(e.target===modal){requestClose(e);return}
      var b=e.target.closest('[data-de-action]');
      if(!b)return;
      var action=b.dataset.deAction,id=b.dataset.deId,owner=b.dataset.deOwner;
      if(!id||!owner)return;
      (async function(){
        try{
          if(action==='edit-service'){await service(owner,id);return}
          if(action==='edit-portfolio'){await portfolio(owner,id);return}
          if(action==='delete-service'){
            if(!confirm('Hapus layanan ini?'))return;
            showLoading('Menghapus…','Tunggu sebentar.');
            try{var r=await S().from('creator_services').delete().eq('id',id).eq('creator_id',owner);if(r.error)throw r.error;toast('Layanan dihapus.','success');await service(owner)}finally{hideLoading()}
            return;
          }
          if(action==='delete-portfolio'){
            if(!confirm('Hapus karya ini?'))return;
            showLoading('Menghapus…','Tunggu sebentar.');
            try{var r=await S().from('creator_portfolios').delete().eq('id',id).eq('creator_id',owner);if(r.error)throw r.error;toast('Karya dihapus.','success');await portfolio(owner)}finally{hideLoading()}
            return;
          }
        }catch(err){toast(err.message||'Gagal.','error')}
      })();
    });
    if(form){
      form.addEventListener('submit',function(e){
        e.preventDefault();
        if(state==='SAVING')return;
        transition('SAVING');
        showLoading('Menyimpan perubahan…','Data kamu aman, sabar ya!');
        var fd=new FormData(form);
        onSave(fd).then(function(){
          hideLoading();
          transition('SUCCESS');
          toast('Berhasil disimpan! 🎉','success');
          setTimeout(function(){close()},1200);
        }).catch(function(err){
          hideLoading();
          transition('ERROR');
          var msg=(err&&err.message)?err.message:'Terjadi kesalahan.';
          console.error('[Dapur Save Error]',err);
          toast('❌ '+msg,'error');
        });
      });
    }
    transition('IDLE');
  }
  function initials(v){return String(v||'?').trim().slice(0,1).toUpperCase()}
  async function compressAvatar(file){if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('Foto harus JPG, PNG, atau WebP.');if(file.size>5*1024*1024)throw new Error('Ukuran foto maksimal 5 MB.');const src=URL.createObjectURL(file);try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Foto tidak dapat dibaca.'));i.src=src});const max=512,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));const x=c.getContext('2d');x.drawImage(img,0,0,c.width,c.height);let q=.82;let blob=await new Promise(r=>c.toBlob(r,'image/webp',q));while(blob&&blob.size>450*1024&&q>.55){q-=.07;blob=await new Promise(r=>c.toBlob(r,'image/webp',q))}if(!blob||blob.size>500*1024)throw new Error('Foto masih terlalu besar setelah dikompres.');return blob}finally{URL.revokeObjectURL(src)}}
  async function uploadAvatar(file,userId){const blob=await compressAvatar(file);const path=userId+'/avatar.webp';const st=S().storage.from('creator-media');const r=await st.upload(path,blob,{contentType:'image/webp',cacheControl:'3600',upsert:true});if(r.error)throw r.error;const u=st.getPublicUrl(path);if(!u||!u.data||!u.data.publicUrl)throw new Error('URL foto profil tidak tersedia.');return u.data.publicUrl+'?v='+Date.now()}
  function listBlock(title,note,rows,kind,owner){if(!rows||!rows.length)return '';var h='<section class="de-list"><div class="de-list-head"><span class="de-list-title">'+esc(title)+'</span><span class="de-list-note">'+esc(note)+'</span></div>';rows.forEach(function(r){h+='<article class="de-item"><div class="de-item-main"><div class="de-item-title">'+esc(r.title)+'</div><div class="de-item-desc">'+esc(r.description||'')+'</div><div class="de-item-meta">'+(kind==='service'?(r.is_active?'✅ Aktif':'⏸️ Disimpan')+' · '+Number(r.delivery_days||0)+' hari':(r.is_active?'👁️ Tampil':'⏸️ Disimpan')+' · '+esc(r.media_type||'link'))+'</div></div><div class="de-item-actions"><button type="button" class="de-mini" data-de-action="edit-'+kind+'" data-de-id="'+esc(r.id)+'" data-de-owner="'+esc(owner)+'">✏️ Edit</button><button type="button" class="de-mini danger" data-de-action="delete-'+kind+'" data-de-id="'+esc(r.id)+'" data-de-owner="'+esc(owner)+'">🗑️ Hapus</button></div></article>'});h+='</section>';return h}
  async function checkIsAdmin(){try{const r=await S().rpc('is_admin');return!r.error&&r.data===true}catch{return false}}
  async function profile(id,forceUserId){
    var r=await S().from('creator_profiles').select('user_id,username,username_changed_at,display_name,bio,avatar_url,whatsapp,contact_email,location,is_published').eq('id',id).maybeSingle();
    if(r.error||!r.data)throw r.error||new Error('Creator tidak ditemukan.');
    var c=r.data;
    var locked=!!c.username_changed_at;
    var avatar=c.avatar_url||'';
    var isAdmin=await checkIsAdmin();
    var effectiveUserId=forceUserId||c.user_id;
    shell('✏️ Foyer · Profil Creator','Rapikan identitas utama Creator-mu.',
      '<div class="de-avatar"><div class="de-avatar-preview">'+(avatar?'<img src="'+esc(avatar)+'" alt="Foto profil">':esc(initials(c.display_name)))+'</div><div class="de-file"><b>📸 Foto Profil</b><input name="avatar_file" type="file" accept="image/jpeg,image/png,image/webp"><small>JPG/PNG/WebP · maks 5 MB sebelum kompres.</small></div></div>'+
      field('username','👤 Username',c.username,'text',locked?'🔒 Username sudah dikunci.':'3–40 karakter','autocomplete="username" pattern="(?:[a-z0-9]|-){3,40}" maxlength="40" '+(locked?'disabled':''))+
      field('display_name','✨ Nama Tampilan',c.display_name,'text','Nama brand kamu','required maxlength="80"')+
      area('bio','📝 Bio Singkat',c.bio,'1–3 kalimat siapa kamu.')+
      field('whatsapp','📱 WhatsApp',c.whatsapp,'text','Contoh: 62812xxxx','inputmode="tel"')+
      field('contact_email','📧 Email Kontak',c.contact_email,'email','Email aktif.')+
      field('location','📍 Lokasi',c.location,'text','Kota/area layanan.')+
      check('is_published','🌐 Tampilkan ke Publik',c.is_published,'Matiin bila masih disiapkan.'),
    async function(f){
      var username=String(f.get('username')||c.username).trim().toLowerCase();
      var p={
        display_name:String(f.get('display_name')||'').trim(),
        bio:String(f.get('bio')||'').trim(),
        whatsapp:String(f.get('whatsapp')||'').trim(),
        contact_email:String(f.get('contact_email')||'').trim(),
        location:String(f.get('location')||'').trim(),
        is_published:f.has('is_published')
      };
      if(!p.display_name)throw new Error('Nama tampilan wajib diisi.');
      if(!/^(?:[a-z0-9]|-){3,40}$/.test(username))throw new Error('Username harus 3–40 karakter.');
      if(!locked&&username!==c.username){
        var v=await S().rpc('validate_creator_username',{p_username:username});
        if(v.error)throw v.error;
        var ch=await S().rpc('change_creator_username_once',{p_username:username});
        if(ch.error)throw ch.error;
      }
      var file=f.get('avatar_file');
      if(file&&file.size)p.avatar_url=await uploadAvatar(file,effectiveUserId);
      var u;
      if(isAdmin){u=await S().from('creator_profiles').update(p).eq('id',id)}
      else{u=await S().from('creator_profiles').update(p).eq('id',id).eq('user_id',effectiveUserId)}
      if(u.error)throw u.error;
      await window.Dapur?.boot?.();
    });
  }
  async function service(id,editId){
    var s={title:'',description:'',price_from:0,price_to:0,delivery_days:3,is_active:true};
    if(editId){var sr=await S().from('creator_services').select('*').eq('id',editId).eq('creator_id',id).maybeSingle();if(sr.error||!sr.data)throw sr.error||new Error('Hidangan tidak ditemukan.');s=sr.data}
    var lr=await S().from('creator_services').select('id,title,description,price_from,price_to,delivery_days,is_active').eq('creator_id',id).order('created_at',{ascending:false});
    if(lr.error)throw lr.error;
    shell(editId?'🍽️ Hidangan · Edit':'🍽️ Hidangan · Tambah','Bikin layanan yang jelas.',
      listBlock('Layanan yang sudah ada','Edit atau hapus.',lr.data||[],'service',id)+
      field('title','📌 Nama Layanan',s.title,'text','Nama singkat.','required maxlength="100"')+
      area('description','💬 Deskripsi',s.description,'Output & manfaat.')+
      '<div class="de-grid"><div>'+field('price_from','💰 Harga Mulai (Rp)',s.price_from,'number','Terendah.','min="0" step="1"')+'</div><div>'+field('price_to','💰 Harga Sampai (Rp)',s.price_to,'number','Tertinggi.','min="0" step="1"')+'</div></div>'+
      field('delivery_days','⏰ Estimasi (hari)',s.delivery_days,'number','Berapa hari.','min="1" max="365" step="1"')+
      check('is_active','👁️ Tampilkan',s.is_active,'Matiin sementara.'),
    async function(f){
      var title=String(f.get('title')||'').trim(),desc=String(f.get('description')||'').trim();
      var from=Math.max(0,Number(f.get('price_from')||0)),to=Math.max(0,Number(f.get('price_to')||0)),days=Math.max(1,Number(f.get('delivery_days')||1));
      if(!title||!desc)throw new Error('Nama dan deskripsi wajib diisi.');
      if(to&&to<from)throw new Error('Harga sampai < harga mulai.');
      var p={creator_id:id,title:title,description:desc,price_from:from,price_to:to,delivery_days:days,is_active:f.has('is_active')};
      var r=editId?await S().from('creator_services').update(p).eq('id',editId).eq('creator_id',id):await S().from('creator_services').insert(p);
      if(r.error)throw r.error;
      await window.Dapur?.boot?.();
    });
  }
  async function portfolio(id,editId){
    var p={title:'',description:'',media_url:'',media_type:'link',sort_order:0,is_active:true};
    if(editId){var pr=await S().from('creator_portfolios').select('*').eq('id',editId).eq('creator_id',id).maybeSingle();if(pr.error||!pr.data)throw pr.error||new Error('Ambalan tidak ditemukan.');p=pr.data}
    var detect=function(url){try{var x=new URL(String(url||'').trim()),host=x.hostname.toLowerCase(),path=x.pathname.toLowerCase();if(/(^|\.)youtube\.com$|^youtu\.be$/.test(host))return'youtube';if(/(^|\.)drive\.google\.com$|(^|\.)docs\.google\.com$/.test(host))return'drive';if(/(^|\.)tiktok\.com$/.test(host))return'tiktok';if(/(^|\.)instagram\.com$/.test(host))return'instagram';if(/\.(png|jpe?g|webp|gif|avif|svg)(?:$|[?#])/i.test(path))return'image';if(/\.(mp4|webm|m4v|mov|ogv)(?:$|[?#])/i.test(path))return'video';return'link'}catch{return null}};
    var lr=await S().from('creator_portfolios').select('id,title,description,media_type,media_url,sort_order,is_active').eq('creator_id',id).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
    if(lr.error)throw lr.error;
    shell(editId?'🏆 Ambalan · Edit':'🏆 Ambalan · Tambah','Pamerin karya terbaikmu.',
      listBlock('Karya yang sudah ada','Edit atau hapus.',lr.data||[],'portfolio',id)+
      field('title','📌 Judul Karya',p.title,'text','Nama karya.','required maxlength="100"')+
      area('description','📖 Cerita',p.description,'Peran & hasil.')+
      field('media_url','🔗 Link',p.media_url,'url','YouTube, Drive, foto.','required placeholder="https://..."')+
      field('sort_order','🔢 Urutan',p.sort_order,'number','0 paling awal.','min="0" step="1"')+
      check('is_active','👁️ Tampilkan',p.is_active,'Matiin sementara.'),
    async function(f){
      var url=String(f.get('media_url')||'').trim(),type=detect(url);
      if(!url||!type)throw new Error('Link tidak valid.');
      var q={creator_id:id,title:String(f.get('title')||'').trim(),description:String(f.get('description')||'').trim(),media_url:url,media_type:type,sort_order:Math.max(0,Number(f.get('sort_order')||0)),is_active:f.has('is_active')};
      if(!q.title||!q.description)throw new Error('Judul dan cerita wajib diisi.');
      var r=editId?await S().from('creator_portfolios').update(q).eq('id',editId).eq('creator_id',id):await S().from('creator_portfolios').insert(q);
      if(r.error)throw r.error;
      await window.Dapur?.boot?.();
    });
  }
  async function categories(id){
    var a=await S().from('ai_categories').select('id,name,slug').eq('is_active',true).order('name');
    var b=await S().from('creator_category_members').select('category_id,is_primary').eq('creator_id',id);
    if(a.error)throw a.error;if(b.error)throw b.error;
    var selected=(b.data||[]).map(function(x){return x.category_id});
    var primaryCat=(b.data||[]).find(function(x){return x.is_primary})?.category_id||selected[0]||'';
    var MAX_CATS=3;
    var allCats=a.data||[];
    shell('🧭 Menu · Fokus Creator','Pilih maksimal 3 kategori.',
      '<div class="de-tip"><b>💡 Tips:</b> pilih max 3 kategori. Pilih 1 utama.</div>'+
      '<div id="de-cat-notice" class="de-cat-count">Dipilih: <strong>'+selected.length+'</strong> / '+MAX_CATS+'</div>'+
      '<div class="de-cat-grid">'+allCats.map(function(c){return '<label class="de-cat '+(selected.includes(c.id)?'selected':'')+'"><input type="checkbox" name="cat" value="'+esc(c.id)+'" data-cat-name="'+esc(c.name)+'" '+(selected.includes(c.id)?'checked':'')+'><span>'+esc(c.name)+'</span></label>'}).join('')+'</div>'+
      '<div class="de-cat-primary"><label for="de-primary-cat">⭐ Kategori Utama</label><select id="de-primary-cat" name="primary_cat"><option value="">-- Pilih --</option>'+allCats.filter(function(c){return selected.includes(c.id)}).map(function(c){return '<option value="'+esc(c.id)+'" '+(c.id===primaryCat?'selected':'')+'>'+esc(c.name)+'</option>'}).join('')+'</select></div>',
    async function(f){
      var ids=f.getAll('cat').map(String);
      var primarySel=f.get('primary_cat');
      if(!ids.length)throw new Error('Pilih minimal 1 kategori.');
      if(ids.length>MAX_CATS)throw new Error('Maksimal '+MAX_CATS+' kategori.');
      if(primarySel&&ids.indexOf(primarySel)===-1)throw new Error('Kategori utama harus dipilih.');
      var r=await S().from('creator_category_members').delete().eq('creator_id',id);
      if(r.error)throw r.error;
      r=await S().from('creator_category_members').insert(ids.map(function(cat_id){return{creator_id:id,category_id:cat_id,is_primary:cat_id===primarySel}}));
      if(r.error)throw r.error;
      await window.Dapur?.boot?.();
    });
    setTimeout(function(){
      var grid=modal&&modal.querySelector('.de-cat-grid');
      var notice=modal&&modal.querySelector('#de-cat-notice');
      var primarySel=modal&&modal.querySelector('#de-primary-cat');
      if(!grid||!notice||!primarySel)return;
      var handler=function(){
        var checked=grid.querySelectorAll('input[type="checkbox"]:checked');
        var count=checked.length;
        notice.innerHTML='Dipilih: <strong>'+count+'</strong> / '+MAX_CATS+' kategori';
        notice.style.color=count>MAX_CATS?'#dc2626':'';
        var prevVal=primarySel.value;
        primarySel.innerHTML='<option value="">-- Pilih --</option>';
        checked.forEach(function(cb){var opt=document.createElement('option');opt.value=cb.value;opt.textContent=cb.dataset.catName||cb.value;if(cb.value===prevVal)opt.selected=true;primarySel.appendChild(opt)});
        if(prevVal&&!primarySel.querySelector('option[value="'+prevVal+'"]'))primarySel.value='';
      };
      grid.addEventListener('change',handler,{passive:true});
    },50);
  }
  async function adminPanel(){
    var r=await S().from('creator_profiles').select('id,user_id,username,display_name,is_published,is_verified').order('created_at',{ascending:false});
    if(r.error)throw r.error;
    var creators=r.data||[];
    shell('🛠️ Admin · Kelola Creator','Pilih Creator.',
      '<div class="de-admin-badge">🔒 Mode Admin</div>'+
      '<div class="de-admin-select"><label for="de-admin-creator">👤 Pilih Creator</label>'+
      '<select id="de-admin-creator"><option value="">-- Pilih --</option>'+
      creators.map(function(c){return '<option value="'+esc(c.id)+'" data-user-id="'+esc(c.user_id)+'">'+esc(c.display_name||c.username)+' (@'+esc(c.username)+') '+(c.is_published?'🟢':'')+' '+(c.is_verified?'✅':'')+'</option>'}).join('')+
      '</select></div>'+
      '<div id="de-admin-actions" style="display:none"><div class="de-tip"><b>🎯 Edit:</b> profil, menu, hidangan, ambalan.</div>'+
      '<div class="de-grid" style="grid-template-columns:1fr 1fr">'+
      '<button type="button" class="de-btn" data-admin-action="profile">✏️ Edit Profil</button>'+
      '<button type="button" class="de-btn" data-admin-action="categories">🧭 Kelola Menu</button>'+
      '<button type="button" class="de-btn" data-admin-action="service">🍽️ Kelola Hidangan</button>'+
      '<button type="button" class="de-btn" data-admin-action="portfolio">🏆 Kelola Ambalan</button>'+
      '</div></div>',
    async function(){close();toast('Panel admin ditutup.','info')});
    setTimeout(function(){
      var sel=modal&&modal.querySelector('#de-admin-creator');
      var actions=modal&&modal.querySelector('#de-admin-actions');
      if(!sel||!actions)return;
      sel.addEventListener('change',function(){actions.style.display=sel.value?'block':'none'},{passive:true});
      actions.addEventListener('click',async function(e){
        var btn=e.target.closest('[data-admin-action]');
        if(!btn||!sel.value)return;
        var action=btn.dataset.adminAction;
        var opt=sel.options[sel.selectedIndex];
        var userId=opt&&opt.dataset?opt.dataset.userId:'';
        close();
        try{
          if(action==='profile')return await profile(sel.value,userId);
          if(action==='categories')return await categories(sel.value);
          if(action==='service')return await service(sel.value);
          if(action==='portfolio')return await portfolio(sel.value);
        }catch(err){toast(err.message||'Gagal.','error')}
      });
    },50);
  }
  window.AdminDapurUI={profile:profile,categories:categories,service:service,portfolio:portfolio,close:close,adminPanel:adminPanel};
})();
