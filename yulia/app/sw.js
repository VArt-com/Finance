/* Yulia Fit — service worker: работа без интернета. Меняйте VERSION при обновлении файлов. */
const VERSION='yfit-v1';
const CORE=['./','index.html','app.css','app.js','figure.js','data.js','manifest.webmanifest',
 'icons/favicon.svg','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','../img/hero.jpg','../img/about.jpg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  /* страницы: сначала сеть (свежая версия), при отсутствии сети — кэш */
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(VERSION).then(c=>c.put('index.html',cp));return res}).catch(()=>caches.match('index.html')));
    return;
  }
  /* свои файлы и шрифты: из кэша, обновляем в фоне */
  const own=u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(!own)return;
  e.respondWith(caches.match(r).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp))}return res}).catch(()=>hit);
    return hit||net;
  }));
});
