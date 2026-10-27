import assert from 'node:assert/strict'
import test from 'node:test'
import { remainingAdvertisementTime } from './adExpiry.js'

test('advertisement expiry uses server time and request duration', () => {
  const ad = { server_time: '2026-10-27T12:00:00Z', expires_at: '2026-10-27T12:01:00Z' }
  assert.equal(remainingAdvertisementTime(ad, 3000), 57000)
  assert.equal(remainingAdvertisementTime(ad, 60000), 0)
  assert.equal(remainingAdvertisementTime(ad, 61000), 0)
  assert.equal(remainingAdvertisementTime(ad, 0), 60000)
})

test('missing server timestamps fail closed', () => {
  assert.equal(remainingAdvertisementTime({ expires_at: 'invalid', server_time: 'invalid' }, 0), 0)
})
