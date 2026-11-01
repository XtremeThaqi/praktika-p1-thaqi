import test from 'node:test'
import assert from 'node:assert/strict'
import { saveAdvertisementEditWithImage } from './advertisementSave.js'

test('a rejected image replacement never starts a separate metadata save', async () => {
  const calls = []
  const failure = { status: 422 }
  const request = (url, options) => {
    calls.push({ url, options })
    return Promise.reject(failure)
  }

  await assert.rejects(saveAdvertisementEditWithImage(request, 7, {
    business_id: 3, alt_text: 'Përshkrim i ri', destination: null, is_active: true,
  }, 'business', null, 42), (error) => error === failure)

  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/admin/advertisements/7/image')
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.body.get('business_id'), '3')
  assert.equal(calls[0].options.body.get('business_image_id'), '42')
  assert.equal(calls[0].options.body.get('alt_text'), 'Përshkrim i ri')
  assert.equal(calls[0].options.body.get('destination'), '')
  assert.equal(calls[0].options.body.get('is_active'), '1')
})
