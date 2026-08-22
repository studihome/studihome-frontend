(()=>{
'use strict';
if(window.__STUDIHOME_SUPABASE_SDK_LOADER__)return;
window.__STUDIHOME_SUPABASE_SDK_LOADER__=true;
const sources=[
 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
 'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
];
let i=0;
function load(){
 if(window.supabase?.createClient){window.dispatchEvent(new CustomEvent('studihome:supabase-sdk-ready'));return;}
 if(i>=sources.length){window.dispatchEvent(new CustomEvent('studihome:supabase-sdk-failed'));return;}
 const s=document.createElement('script');
 s.src=sources[i++];
 s.crossOrigin='anonymous';
 s.onload=()=>{if(window.supabase?.createClient)window.dispatchEvent(new CustomEvent('studihome:supabase-sdk-ready'));else load()};
 s.onerror=load;
 document.head.appendChild(s);
}
load();
})();