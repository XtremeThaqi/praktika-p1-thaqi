export function remainingAdvertisementTime(advertisement, requestElapsedMs) {
  const end = Date.parse(advertisement.expires_at)
  const server = Date.parse(advertisement.server_time)
  if (!Number.isFinite(end) || !Number.isFinite(server)) return 0
  return Math.max(0, end - server - requestElapsedMs)
}
