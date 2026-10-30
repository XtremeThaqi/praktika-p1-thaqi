import test from 'node:test'
import assert from 'node:assert/strict'
import { activeHours, applyWeekdayHours, blankHours, confirmArchiveAction, confirmLogoutAction, fieldForError, firstInvalidField, focusInvalidField, guardUnsavedHistory, hasNewImage, isRequired, mapPoint, sectionForField, validPoint } from './businessForm.js'

test('Monday appears first while Sunday retains day zero', () => {
  assert.deepEqual(blankHours().map((hour) => hour.day_of_week), [1, 2, 3, 4, 5, 6, 0])
})

test('draft and publication indicators match the server rules', () => {
  assert.equal(isRequired('name', 'draft', 'draft'), true)
  for (const field of ['description', 'category_id', 'settlement_id', 'phone', 'address', 'latitude', 'longitude']) {
    assert.equal(isRequired(field, 'draft', 'draft'), false)
    assert.equal(isRequired(field, 'publish', 'draft'), true)
  }
  assert.equal(isRequired('location_verified', 'publish', 'draft'), true)
  assert.equal(isRequired('location_verified', 'publish', 'draft', true), false)
  assert.equal(isRequired('website', 'publish', 'draft'), false)
  assert.equal(isRequired('email', 'publish', 'draft'), false)
})

test('hour validation indexes map to the displayed enabled day', () => {
  const hours = blankHours()
  hours[0].enabled = true
  hours[6].enabled = true
  assert.equal(fieldForError('hours.1.closes_at', hours), 'hours-0-closes_at')
  assert.equal(fieldForError('hours.1', hours), 'hours')
  assert.equal(fieldForError('services.0', hours), 'services')
  assert.equal(firstInvalidField({ 'hours.1.closes_at': ['Invalid'], phone: ['Required'] }, hours), 'phone')
})

test('validation navigation expands the section containing the failed control', () => {
  assert.equal(sectionForField('latitude'), 'location')
  assert.equal(sectionForField('hours-1-closes_at'), 'schedule')
  assert.equal(sectionForField('social_links-facebook'), 'media')
  assert.equal(sectionForField('name'), 'basic')
})

test('weekday shortcut changes only Monday through Friday on explicit use', () => {
  const hours = blankHours()
  hours[5].enabled = true
  hours[5].is_closed = true
  const changed = applyWeekdayHours(hours, '20:00', '02:00')
  assert.deepEqual(activeHours(changed).map((hour) => hour.day_of_week), [1, 2, 3, 4, 5, 6])
  assert.equal(changed[0].opens_at, '20:00')
  assert.equal(changed[0].closes_at, '02:00')
  assert.deepEqual(changed[5], hours[5])
  assert.equal(changed[6].enabled, false)
})

test('validation focus uses the actual field and respects reduced motion', () => {
  let scrolled, focused
  const root = { getElementById: (id) => id === 'business-phone' ? {
    scrollIntoView: (options) => { scrolled = options },
    focus: (options) => { focused = options },
  } : null }
  globalThis.window = { matchMedia: () => ({ matches: true }) }
  assert.equal(focusInvalidField('phone', root), true)
  assert.deepEqual(scrolled, { behavior: 'instant', block: 'center' })
  assert.deepEqual(focused, { preventScroll: true })
  assert.equal(focusInvalidField('missing', root), false)
  delete globalThis.window
})

test('map click and marker drag use the same precise coordinate conversion', () => {
  assert.deepEqual(mapPoint({ lat: 42.521312345, lng: 21.1226789 }), ['42.5213123', '21.1226789'])
  assert.equal(validPoint('', ''), false)
  assert.equal(validPoint('42.5213123', '21.1226789'), true)
  assert.equal(validPoint('100', '21.1'), false)
})

test('an uncertain upload is considered saved only when a matching new image appears', () => {
  const known = new Set([7])
  assert.equal(hasNewImage([{ id: 7, alt_text: 'Foto', kind: 'gallery' }], known, 'Foto', 'gallery'), false)
  assert.equal(hasNewImage([{ id: 7, alt_text: 'Foto', kind: 'gallery' }, { id: 8, alt_text: 'Foto', kind: 'logo' }], known, 'Foto', 'gallery'), false)
  assert.equal(hasNewImage([{ id: 8, alt_text: 'Foto', kind: 'gallery' }], known, 'Foto', 'gallery'), true)
})

test('archiving pending edits requires an explicit discard decision', () => {
  let prompt = ''
  assert.equal(confirmArchiveAction('Biznes provë', true, (message) => { prompt = message; return false }), false)
  assert.match(prompt, /Ndryshimet e paruajtura do të humbin/)
  assert.match(prompt, /Biznes provë/)
  assert.equal(confirmArchiveAction('Biznes provë', false, (message) => { prompt = message; return true }), true)
  assert.doesNotMatch(prompt, /Ndryshimet e paruajtura/)
})

test('dirty logout can be cancelled while clean logout proceeds directly', () => {
  let confirmations = 0
  const reject = () => { confirmations += 1; return false }
  assert.equal(confirmLogoutAction(true, reject), false)
  assert.equal(confirmations, 1)
  assert.equal(confirmLogoutAction(false, reject), true)
  assert.equal(confirmations, 1)
})

test('cancelling browser Back restores URL and history without changing the form', async () => {
  const entries = ['/admin/businesses', '/admin/businesses/1']
  let index = 1
  let renderedRoute = entries[index]
  const formName = 'Unsaved edit'
  const restoring = { current: false }
  let accept = false
  let prompts = 0
  const history = { forward() { queueMicrotask(() => { index += 1; dispatch() }) } }
  function dispatch() {
    let stopped = false
    guardUnsavedHistory({ stopImmediatePropagation() { stopped = true } }, true, restoring, history,
      () => { prompts += 1; return accept })
    if (!stopped) renderedRoute = entries[index]
  }
  index -= 1; dispatch()
  await Promise.resolve()
  assert.equal(index, 1)
  assert.equal(renderedRoute, '/admin/businesses/1')
  assert.equal(formName, 'Unsaved edit')
  assert.equal(restoring.current, false)
  assert.equal(prompts, 1)
  accept = true
  index -= 1; dispatch()
  assert.equal(index, 0)
  assert.equal(renderedRoute, '/admin/businesses')
  assert.equal(prompts, 2)
})
