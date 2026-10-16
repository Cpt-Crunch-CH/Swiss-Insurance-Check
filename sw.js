// Offline-Betrieb: App-Dateien und Bibliotheken werden im Gerät zwischengespeichert.
// Deine Policen liegen nicht hier, sondern im Browser-Speicher des Geräts.
const VERSION = "policen-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
// Nur diese Bibliotheks-Server cachen; die grossen KI-Modelle verwaltet WebLLM selbst
const CDN = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if(req.method !== "GET") return;
  // App-Seite: zuerst Netz (für Updates), sonst Cache
  if(url.origin === location.origin){
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match("index.html"))));
    return;
  }
  // Bibliotheken: zuerst Cache, sonst Netz und merken
  if(CDN.includes(url.hostname)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if(r.ok || r.type === "opaque"){ const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    })));
  }
});
