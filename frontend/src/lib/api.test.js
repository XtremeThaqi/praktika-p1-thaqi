import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getJson, safeWebsite } from './api.js'

test('public JSON requests preserve their path and cancellation signal', async (context) => {
  const controller = new AbortController()
  context.mock.method(globalThis, 'fetch', async (path, options) => {
    assert.equal(path, '/api/businesses?q=demo&page=2')
    assert.equal(options.headers.Accept, 'application/json')
    assert.equal(options.signal, controller.signal)
    return new Response(JSON.stringify({ data: [{ id: 14 }] }))
  })
  assert.deepEqual(
    await getJson('/api/businesses?q=demo&page=2', controller.signal),
    { data: [{ id: 14 }] }
  )
})

test('validation errors use a safe Albanian message', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('private backend details', { status: 422 })
  )
  await assert.rejects(getJson('/api/businesses?page=0'), (error) => {
    assert.equal(error.status, 422)
    assert.match(error.message, /Filtrat nuk janë të vlefshëm/)
    assert.doesNotMatch(error.message, /private/)
    return true
  })
})

test('server failures never display response bodies', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('SQL credentials and stack trace', { status: 500 })
  )
  await assert.rejects(getJson('/api/businesses'), /Të dhënat nuk u ngarkuan/)
})

test('network failures use an understandable retry message', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(
    getJson('/api/businesses'),
    /Lidhja me katalogun nuk u realizua/
  )
})

test('cancelled requests remain cancellations', async (context) => {
  const controller = new AbortController()
  controller.abort()
  context.mock.method(globalThis, 'fetch', async () => {
    throw controller.signal.reason
  })
  await assert.rejects(getJson('/api/businesses', controller.signal), {
    name: 'AbortError',
  })
})

test('unexpected HTML responses do not expose parsing errors', async (context) => {
  context.mock.method(
    globalThis,
    'fetch',
    async () => new Response('<html>private proxy details</html>')
  )
  await assert.rejects(
    getJson('/api/businesses'),
    /Përgjigjja nuk mund të lexohet/
  )
})

test('external links allow only absolute HTTP and HTTPS destinations', () => {
  assert.equal(
    safeWebsite('https://example.com/contact'),
    'https://example.com/contact'
  )
  assert.equal(safeWebsite('http://example.com'), 'http://example.com/')
  for (const value of [
    null,
    '',
    '/relative',
    'javascript:alert(1)',
    'data:text/html,test',
    'file:///private',
  ]) {
    assert.equal(safeWebsite(value), null)
  }
})
