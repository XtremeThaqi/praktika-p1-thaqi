export function previewAdvertisementDestination(destination, business) {
  const value = typeof destination === 'string' ? destination.trim() : ''

  if (value) return value
  return business?.slug ? `/bizneset/${business.slug}` : ''
}
