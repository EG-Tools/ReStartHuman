const CACHE_NAME = 'restarthuman-alpha-v11'
const toScopedUrl = (path) => new URL(path, self.registration.scope).toString()
const APP_SHELL = [
  toScopedUrl('./'),
  toScopedUrl('./offline.html'),
  toScopedUrl('./manifest.webmanifest?v=9'),
  toScopedUrl('./icons/apple-touch-icon-180.png?v=9'),
  toScopedUrl('./icons/app-icon-192.png?v=9'),
  toScopedUrl('./icons/app-icon-512.png?v=9'),
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy)
          })
          return response
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request)
          return cachedPage || caches.match(toScopedUrl('./offline.html'))
        }),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((response) => {
        const copy = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy)
        })
        return response
      })
    }),
  )
})
