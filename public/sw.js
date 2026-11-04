// Service worker simples: abre rapido e funciona com sinal fraco.
// Nunca guarda /api (dados sempre atualizados).
const VERSAO = 'rm-v1';
const SHELL = ['/', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSAO).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;

  // Paginas: rede primeiro, cache como reserva
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(VERSAO).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Arquivos estaticos e fotos: usa cache e atualiza em segundo plano
  const estatico =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|webp|svg|woff2?)$/i.test(url.pathname);
  if (estatico) {
    event.respondWith(
      caches.match(req).then((cache) => {
        const rede = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copia = res.clone();
              caches.open(VERSAO).then((c) => c.put(req, copia));
            }
            return res;
          })
          .catch(() => cache);
        return cache || rede;
      })
    );
  }
});
