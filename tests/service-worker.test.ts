import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

type WorkerHandler = (event: unknown) => void
type RequestLike = string | { url: string }

const requestKey = (request: RequestLike) =>
  typeof request === 'string' ? request : request.url

const createWorkerHarness = (networkResponses: Response[] = []) => {
  const handlers = new Map<string, WorkerHandler>()
  const stores = new Map<string, Map<string, Response>>()
  let fetchCount = 0
  let claimCount = 0

  const openCache = async (name: string) => {
    const store = stores.get(name) ?? new Map<string, Response>()
    stores.set(name, store)

    return {
      addAll: async () => {},
      delete: async (request: RequestLike) => store.delete(requestKey(request)),
      match: async (request: RequestLike) => store.get(requestKey(request))?.clone(),
      put: async (request: RequestLike, response: Response) => {
        store.set(requestKey(request), response.clone())
      },
    }
  }

  const caches = {
    delete: async (name: string) => stores.delete(name),
    keys: async () => [...stores.keys()],
    open: openCache,
  }
  const fetchMock = async () => {
    const response = networkResponses[fetchCount]
    fetchCount += 1

    if (!response) {
      throw new Error('No mock network response configured')
    }

    return response.clone()
  }
  const workerSelf = {
    addEventListener: (type: string, handler: WorkerHandler) => handlers.set(type, handler),
    clients: {
      claim: async () => {
        claimCount += 1
      },
    },
    location: { origin: 'https://example.test' },
    registration: { scope: 'https://example.test/ReStartHuman/' },
    skipWaiting: () => {},
  }

  runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    Response,
    URL,
    caches,
    fetch: fetchMock,
    self: workerSelf,
  })

  const dispatchFetch = async () => {
    const handler = handlers.get('fetch')
    assert.ok(handler)

    let responsePromise: Promise<Response> | undefined
    handler({
      request: {
        method: 'GET',
        mode: 'same-origin',
        url: 'https://example.test/ReStartHuman/report.pdf',
      },
      respondWith: (response: Promise<Response>) => {
        responsePromise = Promise.resolve(response)
      },
    })

    assert.ok(responsePromise)
    return responsePromise
  }

  const dispatchActivate = async () => {
    const handler = handlers.get('activate')
    assert.ok(handler)

    let activationPromise: Promise<unknown> | undefined
    handler({
      waitUntil: (value: Promise<unknown>) => {
        activationPromise = Promise.resolve(value)
      },
    })

    assert.ok(activationPromise)
    await activationPromise
  }

  return {
    dispatchActivate,
    dispatchFetch,
    getClaimCount: () => claimCount,
    getFetchCount: () => fetchCount,
    stores,
  }
}

test('service worker retries a failed download instead of caching the 404', async () => {
  const harness = createWorkerHarness([
    new Response('missing', { status: 404 }),
    new Response('restored', { status: 200 }),
  ])

  assert.equal((await harness.dispatchFetch()).status, 404)
  assert.equal((await harness.dispatchFetch()).status, 200)
  assert.equal((await harness.dispatchFetch()).status, 200)
  assert.equal(harness.getFetchCount(), 2)
})

test('service worker activation removes only this app old caches', async () => {
  const harness = createWorkerHarness()
  harness.stores.set('restarthuman-alpha-v78', new Map())
  harness.stores.set('restarthuman-alpha-v79', new Map())
  harness.stores.set('another-app-cache', new Map())

  await harness.dispatchActivate()

  assert.equal(harness.stores.has('restarthuman-alpha-v78'), false)
  assert.equal(harness.stores.has('restarthuman-alpha-v79'), true)
  assert.equal(harness.stores.has('another-app-cache'), true)
  assert.equal(harness.getClaimCount(), 1)
})
