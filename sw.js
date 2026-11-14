// Service worker: the academy works offline once visited.
// Same-origin GETs go to the network first (so new lessons show up at once) and
// fall back to the cache when offline or after a slow network; every answer
// from the network refreshes the cache. Settings > Offline asks the page to fetch
// every course file, which fills the cache through this same path.
// Other origins (sign-in, cloud sync) are left alone.

const CACHE = 'gibernoot-v1';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/main.js', 'manifest.webmanifest', 'icon.svg',
  'vendor/katex/katex.min.css', 'vendor/katex/katex.min.js', 'vendor/js-yaml.min.js', 'vendor/marked.min.js',
  'vendor/fonts/jersey-10-latin-400-normal.woff2', 'courses/catalog.yaml'];
const SLOW = 4000; // ms before a cached copy is served instead of waiting

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(networkFirst(req, req.mode === 'navigate'));
});

async function networkFirst(req, page) {
  const cache = await caches.open(CACHE);
  const key = page ? 'index.html' : req.url.split('#')[0];
  const net = fetch(req).then(res => {
    if (res.ok && res.type === 'basic') cache.put(key, res.clone());
    return res;
  });
  const cached = () => cache.match(key, { ignoreSearch: true });
  try {
    return await Promise.race([net, new Promise((_, no) => setTimeout(() => no(new Error('slow')), SLOW))]);
  } catch {
    const hit = await cached();
    if (hit) { net.catch(() => {}); return hit; }
    return net; // nothing cached: wait for the network (or its error)
  }
}
