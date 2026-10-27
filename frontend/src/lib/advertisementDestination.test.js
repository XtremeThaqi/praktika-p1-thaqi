import assert from 'node:assert/strict'
import { test } from 'node:test'
import { previewAdvertisementDestination } from './advertisementDestination.js'

test('new advertisements preview the selected business profile by default', () => {
  assert.equal(
    previewAdvertisementDestination('', { slug: 'demo-biznes-03', is_demo: false }),
    '/bizneset/demo-biznes-03'
  )
})

test('demo advertisements keep the public demo destination behavior', () => {
  assert.equal(
    previewAdvertisementDestination('', { slug: 'demo-biznes-03', is_demo: true }),
    ''
  )
})

test('an existing external destination remains unchanged', () => {
  assert.equal(
    previewAdvertisementDestination('https://example.com/sale', { slug: 'demo-biznes-03' }),
    'https://example.com/sale'
  )
})
