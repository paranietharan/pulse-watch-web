import test from 'node:test'
import assert from 'node:assert/strict'
import { apiClient, getAccessToken, onSessionExpired, performTokenRefresh, setAccessToken } from '../lib/api/client.ts'

test('concurrent 401 responses share one refresh', async t => {
  let refreshes = 0
  setAccessToken('old')
  t.mock.method(globalThis, 'fetch', async (url, opts) => {
    if (url.endsWith('/refresh')) {
      refreshes++
      await new Promise(resolve => setImmediate(resolve))
      return Response.json({ access_token: 'new' })
    }
    return opts.headers.get('Authorization') === 'Bearer new' ? Response.json(true) : new Response(null, {status: 401})
  })
  assert.deepEqual(await Promise.all([apiClient('/a'), apiClient('/b')]), [true, true])
  assert.equal(refreshes, 1)
})

test('only an invalid credential expires the session', async t => {
  setAccessToken('original')
  let expired = 0
  const unsubscribe = onSessionExpired(() => expired++)
  t.after(unsubscribe)
  const mock = t.mock.method(globalThis, 'fetch', async () => new Response(null, {status: 503}))
  await assert.rejects(performTokenRefresh())
  mock.mock.mockImplementation(async () => { throw new TypeError('offline') })
  await assert.rejects(performTokenRefresh())
  assert.equal(getAccessToken(), 'original')
  assert.equal(expired, 0)
  mock.mock.mockImplementation(async () => new Response(null, {status: 401}))
  assert.equal(await performTokenRefresh(), null)
  assert.equal(expired, 1)
  assert.equal(getAccessToken(), null)
})
