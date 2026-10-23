import assert from 'node:assert/strict'
import { test } from 'node:test'
import { coordinates, directionsUrl, phoneUrl, emailUrl } from './business.js'

test('coordinates preserve stored numeric values including zero', () => {
  assert.deepEqual(
    coordinates({ latitude: '42.5012000', longitude: '21.1112000' }),
    [42.5012, 21.1112]
  )
  assert.deepEqual(coordinates({ latitude: 0, longitude: 0 }), [0, 0])
})
test('missing and invalid coordinates never become invented markers', () => {
  for (const latitude of [
    null,
    undefined,
    '',
    ' ',
    NaN,
    Infinity,
    91,
    -91,
    'invalid',
  ])
    assert.equal(coordinates({ latitude, longitude: 21 }), null)
  for (const longitude of [null, '', 181, -181])
    assert.equal(coordinates({ latitude: 42, longitude }), null)
})
test('directions use the selected coordinates or remain unavailable', () => {
  assert.equal(
    directionsUrl({ latitude: 42.5, longitude: 21.1 }),
    'https://www.google.com/maps/dir/?api=1&destination=42.5,21.1'
  )
  assert.equal(directionsUrl({ latitude: null, longitude: null }), null)
})
test('phone links retain digits and reject URI injection', () => {
  assert.equal(phoneUrl('+383 00 000 004'), 'tel:+38300000004')
  for (const value of [null, '', '123?x=1', 'javascript:alert(1)', '++383123'])
    assert.equal(phoneUrl(value), null)
})
test('email links use the stored address without injected headers', () => {
  assert.equal(emailUrl('demo@example.com'), 'mailto:demo@example.com')
  for (const value of [
    null,
    'bad',
    'a@example.com?subject=bad',
    'a@example.com\r\nBcc:x@y.com',
  ])
    assert.equal(emailUrl(value), null)
})
