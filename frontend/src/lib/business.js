export function coordinates(business) {
  const { latitude, longitude } = business
  if (
    latitude == null ||
    longitude == null ||
    String(latitude).trim() === '' ||
    String(longitude).trim() === ''
  )
    return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? [lat, lng]
    : null
}

export function directionsUrl(business) {
  const point = coordinates(business)
  return point
    ? `https://www.google.com/maps/dir/?api=1&destination=${point.join(',')}`
    : null
}

export function phoneUrl(phone) {
  if (typeof phone !== 'string' || !/^\+?[\d\s().-]+$/.test(phone.trim()))
    return null
  const number = phone.replace(/[\s().-]/g, '')
  return /^\+?\d{3,15}$/.test(number) ? `tel:${number}` : null
}

export function emailUrl(email) {
  return typeof email === 'string' &&
    /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
    ? `mailto:${encodeURIComponent(email).replace('%40', '@')}`
    : null
}
