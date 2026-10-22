import { useEffect, useState } from 'react'
import { getJson, safeWebsite } from '../lib/api'
import Icon from './Icon'
export default function Advertisement({ placement, onOpen }) {
  const [advertisement, setAdvertisement] = useState(null)
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    let controller
    function load() {
      controller?.abort()
      controller = new AbortController()
      const signal = controller.signal
      getJson(`/api/advertisements?placement=${placement}`, signal)
        .then((result) => {
          if (!signal.aborted) {
            setAdvertisement(result.data[0] || null)
            setImageFailed(false)
          }
        })
        .catch(() => {
          if (!signal.aborted) setAdvertisement(null)
        })
    }
    load()
    const timer = window.setInterval(load, 60000)
    window.addEventListener('focus', load)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('focus', load)
    }
  }, [placement])
  if (!advertisement) return null
  const destination = safeWebsite(advertisement.destination)
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
        {advertisement.business.is_demo ? (
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
