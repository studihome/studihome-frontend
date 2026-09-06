import { createClient } from '@supabase/supabase-js'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }

const creators = [
['av','Arunika Visual Co.','Visual Design & Creative Assets'],['nb','Niskala Brand House','Branding & Identity'],['sm','Sora Motion Works','Motion Graphic & Animation'],['kv','Karsa Video Lab','Video Iklan & Commercial'],['ls','Langit Sore Content','Content Production'],['vs','Veyra Social Craft','Social Media Content'],['lw','Loka Web Atelier','Website & Landing Page'],['np','Nusa Pixel Works','WebApp & Digital Product'],['rf','Reka Flow Systems','Automation & Workflow'],['nw','Nadi WhatsApp Works','WhatsApp Automation'],['ae','Arunika EduAI','AI untuk Pendidikan'],['lk','Lentera Kelas Digital','Learning & Training'],['rg','Rupa Growth Studio','Digital Marketing'],['js','Jejak Search Lab','SEO & Search Content'],['pd','PasarKita Digital','E-Commerce & Digital Store'],['dr','Data Rona Studio','Data & Analytics'],['pp','Pendar Pitch Lab','Presentation & Pitch Deck'],['nn','Narasi Nusa Copy','Copywriting & Sales Content'],['bl','Bumi Lens Creative','Photography & Product Visual'],['ss','Suara Sora Studio','Audio & Voice Production'],['aa','Aksara Agentic Lab','AI Agent & Assistant'],['ro','RapiOps Studio','Productivity & Office Automation'],['nc','Niskala NoCode','No-Code & Low-Code'],['tc','Tumbuh CRM Works','CRM & Customer Workflow'],['ru','Rasa UMKM Lab','UMKM Digitalization'],['cc','Cakrawala Creator Co.','Creator Growth & Personal Brand'],['lm','Lentera Edu Media','Education Media'],['pl','Pijar Presentation Lab','AI Presentation'],['re','Rona Event Creative','Event Creative'],['kl','Karsa Lokal Digital','Local Business Digitalization'],['as','Arunika AI Strategy','AI Strategy & Adoption'],['ao','Alur Digital Ops','Digital Operations'],['su','Svara UX Studio','UI/UX & Product Design'],['bc','Bambu Commerce Lab','Commerce Solutions'],['nr','Nara 3D Render','3D & Product Rendering'],['qf','Qirana Finance AI','Finance Workflow'],['th','Teras HR Lab','HR Workflow'],['rr','Ruang Rancang Digital','Professional Visual'],['sd','Sembada Dataworks','Data Services'],['kr','Kirana Research Studio','Research & Insight'],['ex','Exora AI Works','AI Product Development'],['zr','Zareen Creative Tech','Creative Technology'],['sh','Studihome','AI Ecosystem & Digital Services']
]

function slugify(s:string){return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers:cors})
  try {
    const publishable = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')['default']
    const secrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')['default']
    const auth = req.headers.get('Authorization') || ''
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, publishable, {global:{headers:{Authorization:auth}}})
    const token = auth.replace(/^Bearer\s+/i,'')
    const {data:{user}, error:userError} = await userClient.auth.getUser(token)
    if (userError || !user) return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:cors})
    const {data:profile, error:profileError} = await userClient.from('profiles').select('role,status').eq('id',user.id).single()
    if (profileError || profile?.role !== 'admin' || profile?.status !== 'active') return new Response(JSON.stringify({error:'Admin only'}),{status:403,headers:cors})

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, secrets)
    const results:any[]=[]
    for (const [code,name,focus] of creators) {
      const email=`${code}@studihome.id`
      const username=slugify(name)
      const {data:list}=await admin.auth.admin.listUsers({page:1,perPage:1000})
      let u=list.users.find(x=>x.email?.toLowerCase()===email)
      if (!u) {
        const {data, error}=await admin.auth.admin.createUser({email,email_confirm:true,user_metadata:{name,managed_by_studihome:true,creator_brand:true}})
        if (error) throw new Error(`${email}: ${error.message}`)
        u=data.user
      }
      if (!u) throw new Error(`Unable to resolve ${email}`)
      await admin.from('profiles').upsert({id:u.id,name,role:'member',status:'active',email,email_verified:true},{onConflict:'id'})
      const {data:existing}=await admin.from('creator_profiles').select('id').eq('user_id',u.id).maybeSingle()
      const payload={user_id:u.id,username,display_name:name,bio:`Studio resmi Studihome untuk ${focus.toLowerCase()}. Dikelola dan dioperasikan oleh Studihome.`,is_published:true,is_verified:true,review_status:'APPROVED',review_requested_at:new Date().toISOString(),reviewed_at:new Date().toISOString(),managed_by_studihome:true,contact_email:email,is_studihome_official:name==='Studihome'}
      let row:any
      if(existing?.id){ const {data,error}=await admin.from('creator_profiles').update(payload).eq('id',existing.id).select('id,username').single(); if(error) throw new Error(`${email}: ${error.message}`); row=data }
      else { const {data,error}=await admin.from('creator_profiles').insert(payload).select('id,username').single(); if(error) throw new Error(`${email}: ${error.message}`); row=data }
      results.push({email,name,username,id:row?.id,official:name==='Studihome'})
    }
    return new Response(JSON.stringify({ok:true,total:results.length,results}),{headers:cors})
  } catch(e) { return new Response(JSON.stringify({ok:false,error:String(e)}),{status:500,headers:cors}) }
})