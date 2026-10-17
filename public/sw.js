const CACHE='yixu-shell-v3';
const SHELL=['/','/manifest.webmanifest','/favicon.svg','/icon-192.png','/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(SHELL);const html=await fetch('/').then(r=>r.text());const urls=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(x=>x[1]).filter(x=>x.startsWith('/'));await Promise.allSettled(urls.map(url=>cache.add(url)));})));
self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==='navigate'){event.respondWith(caches.match('/').then(cached=>cached||fetch(request)));return;}
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));return response;})));
});
