import test from 'node:test'
import assert from 'node:assert/strict'
import { advertisementAltText } from './advertisementImage.js'

test('business photographs supply useful alternative text', () => {
  assert.equal(advertisementAltText('Shporta e Lagjes', 'business', 'Rafte me produkte'),
    'Shporta e Lagjes: Rafte me produkte')
})

test('uploaded banners get a business-specific fallback within the server limit', () => {
  assert.equal(advertisementAltText('Shporta e Lagjes', 'upload'),
    'Shporta e Lagjes - imazh reklamues')
  assert.equal(advertisementAltText('A'.repeat(260), 'upload').length, 255)
})
