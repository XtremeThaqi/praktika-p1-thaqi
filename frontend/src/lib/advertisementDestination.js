export function previewAdvertisementDestination(destination, business) {
  const value = typeof destination === 'string' ? destination.trim() : ''

  if (value) return value
  if (business?.is_demo) return ''
  return business?.slug ? `/bizneset/${business.slug}` : ''
}
