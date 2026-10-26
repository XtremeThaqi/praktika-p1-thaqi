import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { adminRequest, loginAdmin, logoutAdmin } from './admin.js'

test('login initializes CSRF and sends credentials with the session cookie', async (t) => {
  const originalFetch = globalThis.fetch
  const originalDocument = globalThis.document
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.document = originalDocument
  })

  globalThis.document = { cookie: 'XSRF-TOKEN=encoded%3Dtoken' }
  const calls = []
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options })
    return path === '/sanctum/csrf-cookie'
      ? { ok: true }
      : { ok: true, json: async () => ({ user: { name: 'Admin' } }) }
  }

  const password = randomBytes(18).toString('hex')
  const result = await loginAdmin('admin@example.test', password)
  assert.equal(result.user.name, 'Admin')
  assert.equal(calls[0].path, '/sanctum/csrf-cookie')
  assert.equal(calls[0].options.credentials, 'include')
  assert.equal(calls[1].path, '/api/admin/login')
  assert.equal(calls[1].options.credentials, 'include')
  assert.equal(calls[1].options.headers['X-XSRF-TOKEN'], 'encoded=token')
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    email: 'admin@example.test',
    password,
  })
})

test('protected requests and logout use session credentials and safe errors', async (t) => {
  const originalFetch = globalThis.fetch
  const originalDocument = globalThis.document
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.document = originalDocument
  })

  globalThis.document = { cookie: 'XSRF-TOKEN=token' }
  const calls = []
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options })
    return { ok: false, status: 401 }
  }

  await assert.rejects(adminRequest('/api/admin/dashboard'), { status: 401 })
  await assert.rejects(logoutAdmin(), { status: 401 })
  assert.equal(calls[0].options.credentials, 'include')
  assert.equal(calls[0].options.cache, 'no-store')
  assert.equal(calls[1].options.headers['X-XSRF-TOKEN'], 'token')
})

test('logout reads the renewed CSRF cookie after login', async (t) => {
  const originalFetch = globalThis.fetch
  const originalDocument = globalThis.document
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.document = originalDocument
  })

  globalThis.document = { cookie: 'XSRF-TOKEN=first-token' }
  const calls = []
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options })
    if (path === '/api/admin/login') {
      globalThis.document.cookie = 'XSRF-TOKEN=renewed-token'
    }
    return { ok: true, json: async () => ({ user: { name: 'Admin' } }) }
  }

  await loginAdmin('admin@example.test', randomBytes(18).toString('hex'))
  await logoutAdmin()
  assert.equal(calls[2].options.headers['X-XSRF-TOKEN'], 'renewed-token')
})

test('referenced taxonomy deletion shows the server explanation', async (t) => {
  const originalFetch = globalThis.fetch
  const originalDocument = globalThis.document
  t.after(() => {
    globalThis.fetch = originalFetch
    globalThis.document = originalDocument
  })

  globalThis.document = { cookie: 'XSRF-TOKEN=token' }
  globalThis.fetch = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ message: 'Ky zë nuk mund të fshihet sepse përdoret nga biznese.' }),
  })

  await assert.rejects(adminRequest('/api/admin/categories/1', { method: 'DELETE' }), {
    status: 409,
    message: 'Ky zë nuk mund të fshihet sepse përdoret nga biznese.',
  })
})
