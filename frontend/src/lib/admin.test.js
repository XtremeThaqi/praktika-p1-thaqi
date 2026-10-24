import test from 'node:test'
import assert from 'node:assert/strict'
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

  const result = await loginAdmin('admin@example.test', 'private-password')
  assert.equal(result.user.name, 'Admin')
  assert.equal(calls[0].path, '/sanctum/csrf-cookie')
  assert.equal(calls[0].options.credentials, 'include')
  assert.equal(calls[1].path, '/api/admin/login')
  assert.equal(calls[1].options.credentials, 'include')
  assert.equal(calls[1].options.headers['X-XSRF-TOKEN'], 'encoded=token')
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    email: 'admin@example.test',
    password: 'private-password',
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

  await loginAdmin('admin@example.test', 'private-password')
  await logoutAdmin()
  assert.equal(calls[2].options.headers['X-XSRF-TOKEN'], 'renewed-token')
})
