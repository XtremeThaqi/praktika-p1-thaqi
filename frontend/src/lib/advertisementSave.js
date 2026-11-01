export function saveAdvertisementEditWithImage(request, id, payload, imageMode, image, photoId) {
  const body = new FormData()
  Object.entries(payload).forEach(([key, value]) => body.set(key, key === 'is_active' ? (value ? '1' : '0') : String(value ?? '')))
  if (imageMode === 'upload') body.set('image', image)
  else body.set('business_image_id', photoId)
  return request(`/api/admin/advertisements/${id}/image`, { method: 'POST', body })
}
