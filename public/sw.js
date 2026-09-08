const CACHE_PREFIX = 'restarthuman-alpha-'
const CACHE_NAME = `${CACHE_PREFIX}v80`
const toScopedUrl = (path) => new URL(path, self.registration.scope).toString()
const APP_SHELL = [
  toScopedUrl('./'),
  toScopedUrl('./offline.html'),
  toScopedUrl('./manifest.webmanifest?v=24'),
  toScopedUrl('./icons/favicon-32.png?v=23'),
  toScopedUrl('./icons/apple-touch-icon-180.png?v=23'),
  toScopedUrl('./icons/app-icon-192.png?v=23'),
  toScopedUrl('./icons/app-icon-512.png?v=23'),
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
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  )
})

const cacheSuccessfulResponse = async (cache, request, response) => {
  if (!response.ok) {
    return
  }

  await cache.put(request, response.clone())
}

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
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request)
          await cacheSuccessfulResponse(cache, event.request, response)
          return response
        } catch {
          const cachedPage = await cache.match(event.request)
          return cachedPage || cache.match(toScopedUrl('./offline.html'))
        }
      }),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request)

      if (cachedResponse?.ok) {
        return cachedResponse
      }

      if (cachedResponse) {
        await cache.delete(event.request)
      }

      const response = await fetch(event.request)
      await cacheSuccessfulResponse(cache, event.request, response)
      return response
    }),
  )
})

