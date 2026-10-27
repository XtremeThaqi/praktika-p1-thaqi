import { useEffect, useState } from 'react'
import { getJson, safeWebsite } from '../lib/api'
import { remainingAdvertisementTime } from '../lib/adExpiry'
import Icon from './Icon'
export default function Advertisement({ placement, onOpen }) {
  const [advertisement, setAdvertisement] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    let controller
    let expiryTimer
    let expiresAt = 0
    function load() {
      if (expiresAt && performance.now() >= expiresAt) {
        window.clearTimeout(expiryTimer)
        expiresAt = 0
        setAdvertisement(null)
      }
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      const requestStarted = performance.now()
      getJson(`/api/advertisements?placement=${placement}`, signal)
        .then((result) => {
          if (!signal.aborted) {
            window.clearTimeout(expiryTimer)
            const next = result.data[0] || null
            const remaining = next ? remainingAdvertisementTime(next, performance.now() - requestStarted) : 0
            expiresAt = next && remaining > 0 ? performance.now() + remaining : 0
            setAdvertisement(expiresAt ? next : null)
            setImageFailed(false)
            if (expiresAt) {
              expiryTimer = window.setTimeout(() => {
                setAdvertisement(null)
                expiresAt = 0
                load()
              }, Math.floor(remaining))
            } else if (next) {
              expiryTimer = window.setTimeout(load, 250)
            }
          }
        })
        .catch(() => {
          if (!signal.aborted) { window.clearTimeout(expiryTimer); expiresAt = 0; setAdvertisement(null) }
        })
    }
    load()
    const timer = window.setInterval(load, 60000)
    window.addEventListener('focus', load)
    return () => {
      controller?.abort()
      window.clearTimeout(expiryTimer)
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [placement])
  if (!advertisement) return null
  const destination = advertisement.destination?.startsWith('/bizneset/')
    ? advertisement.destination
    : safeWebsite(advertisement.destination)
  return (
    <aside
      aria-label="Reklamë"
      className="rounded-2xl border border-[#d6c6a3] bg-[#f2ead9] p-5 sm:p-6"
    >
      <p className="eyebrow text-[#765016]">
        Reklamë {advertisement.business.is_demo && '· Demonstrim'}
      </p>
      {!imageFailed && (
        <img
          src={advertisement.image_path}
          alt={advertisement.alt_text || 'Reklamë e biznesit'}
          className="mt-4 max-h-44 w-full rounded-lg object-contain"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      )}
      <p className="mt-4 font-semibold">{advertisement.business.name}</p>
      {advertisement.business.is_demo && (
        <p className="mt-2 text-sm leading-6 text-muted">
          Hapësirë reklamuese me të dhëna të simuluara. Nuk është rekomandim i
          platformës.
        </p>
      )}
      <div className="mt-4">
        {advertisement.destination?.startsWith('/bizneset/') ? (
          <button className="button-secondary" onClick={() => onOpen(advertisement.business.slug)}>
            Shiko profilin e biznesit <Icon />
          </button>
        ) : advertisement.business.is_demo ? (
          <button
            className="button-secondary"
            onClick={() => onOpen(advertisement.business.slug)}
          >
            Shiko biznesin demo <Icon />
          </button>
        ) : (
          destination && (
            <a
              className="button-secondary"
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hap reklamën <Icon />
            </a>
          )
        )}
      </div>
    </aside>
  )
}
