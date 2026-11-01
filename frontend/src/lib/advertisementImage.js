export function advertisementAltText(businessName, imageMode, photoAlt = '') {
  const name = businessName || 'Reklamë'
  return (imageMode === 'business' && photoAlt
    ? `${name}: ${photoAlt}`
    : `${name} - imazh reklamues`).slice(0, 255)
}
