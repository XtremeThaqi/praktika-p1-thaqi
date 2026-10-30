export const days = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë']
export const displayDays = [1, 2, 3, 4, 5, 6, 0]

export function isRequired(field, intent, status, isDemo = false) {
  if (field === 'name') return true
  if (intent !== 'publish' && status !== 'published') return false
  if (field === 'location_verified') return !isDemo
  return ['description', 'category_id', 'settlement_id', 'phone', 'address', 'latitude', 'longitude'].includes(field)
}

export function blankHours() {
  return displayDays.map((day_of_week) => ({
    day_of_week, enabled: false, is_closed: false, opens_at: '08:00', closes_at: '17:00',
  }))
}

export function activeHours(hours) {
  return hours.filter((hour) => hour.enabled).map(({ day_of_week, is_closed, opens_at, closes_at }) => ({
    day_of_week, is_closed, opens_at: is_closed ? null : opens_at, closes_at: is_closed ? null : closes_at,
  }))
}

export function fieldForError(key, hours) {
  const hour = /^hours\.(\d+)\.(.+)$/.exec(key)
  if (hour) {
    const row = activeHours(hours)[Number(hour[1])]
    return row ? `hours-${row.day_of_week}-${hour[2]}` : 'hours'
  }
  if (key.startsWith('services.')) return 'services'
  if (key.startsWith('social_links.')) return key.replace('.', '-')
  if (key === 'alt_text' || key === 'kind') return key
  if (key === 'image') return 'image'
  return key
}

export function sectionForField(field) {
  if (['latitude', 'longitude', 'location_verified'].includes(field)) return 'location'
  if (field === 'services' || field.startsWith('hours')) return 'schedule'
  if (['image', 'alt_text', 'kind', 'email', 'website'].includes(field) || field.startsWith('social_links-')) return 'media'
  return 'basic'
}

export function firstInvalidField(errors, hours) {
  const fields = Object.keys(errors).map((key) => fieldForError(key, hours))
  const order = ['name', 'description', 'category_id', 'settlement_id', 'phone', 'address',
    'latitude', 'longitude', 'location_verified', 'services',
    ...displayDays.flatMap((day) => ['day_of_week', 'is_closed', 'opens_at', 'closes_at'].map((part) => `hours-${day}-${part}`)),
    'image', 'kind', 'alt_text', 'website', 'email', 'social_links-facebook', 'social_links-instagram', 'social_links-linkedin']
  return order.find((field) => fields.includes(field)) || fields[0]
}

export function focusInvalidField(field, root = document) {
  const target = root.getElementById(`business-${field}`)
  if (!target) return false
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'center' })
  target.focus({ preventScroll: true })
  return true
}

export function applyWeekdayHours(hours, opens_at, closes_at) {
  return hours.map((hour) => hour.day_of_week >= 1 && hour.day_of_week <= 5
    ? { ...hour, enabled: true, is_closed: false, opens_at, closes_at }
    : hour)
}

export function mapPoint(point) {
  return [point.lat.toFixed(7), point.lng.toFixed(7)]
}

export function validPoint(latitude, longitude) {
  const lat = Number(latitude)
  const lng = Number(longitude)
  return latitude !== '' && latitude != null && longitude !== '' && longitude != null &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
}
