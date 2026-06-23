const CACHE_NAME = 'expense-tracker-v2'
const ASSETS = ['/manifest.json', '/icon-192.png', '/icon-512.png', '/placeholder-logo.png']

// Instalar: precachear solo íconos/estáticos y activar de inmediato
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
  self.skipWaiting()
})

// Activar: borrar cachés viejas y tomar control de las pestañas abiertas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // No interceptar API ni pedidos que no sean GET (siempre datos frescos)
  if (request.method !== 'GET' || new URL(request.url).pathname.startsWith('/api/')) {
    return
  }

  // Navegación (HTML): primero la red, así siempre ves la última versión.
  // Si no hay internet, caemos a lo cacheado.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(request).then((r) => r || caches.match('/'))))
    return
  }

  // Resto (íconos, imágenes): caché primero, y si no está, red (y la guardamos)
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return res
        })
    )
  )
})
