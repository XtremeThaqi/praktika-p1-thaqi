import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { coordinates, directionsUrl } from '../lib/business'

export default function BusinessMap({
  businesses,
  navigate,
  title = 'Vendndodhja',
}) {
  const container = useRef(null)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('loading')
  const valid = businesses.filter((business) => coordinates(business))

  useEffect(() => {
    if (!valid.length) return
    setStatus('loading')
    let map
    let timeout
    try {
      map = L.map(container.current, { scrollWheelZoom: false })
      const tiles = L.tileLayer(
        import.meta.env.VITE_MAP_TILE_URL ||
          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      )
      tiles.on('tileerror', () => setStatus('error'))
      tiles.on('load', () => {
        window.clearTimeout(timeout)
        setStatus((current) => (current === 'error' ? current : 'ready'))
      })
      timeout = window.setTimeout(() => setStatus('error'), 15000)
      const points = []
      for (const business of valid) {
        const point = coordinates(business)
        points.push(point)
        const popup = document.createElement('div')
        const heading = document.createElement('strong')
        heading.textContent = business.name
        const address = document.createElement('p')
        address.textContent = business.address || 'Adresa nuk është publikuar.'
        const link = document.createElement('a')
        link.textContent = 'Shiko biznesin'
        link.href = `/bizneset/${encodeURIComponent(business.slug)}`
        link.addEventListener('click', (event) => {
          if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
          )
            return
          event.preventDefault()
          navigate(link.getAttribute('href'))
        })
        const directions = document.createElement('a')
        directions.textContent = 'Shiko udhëzimet'
        directions.href = directionsUrl(business)
        directions.target = '_blank'
        directions.rel = 'noopener noreferrer'
        directions.style.display = 'block'
        popup.append(heading, address, link, directions)
        L.marker(point, {
          title: business.name,
          alt: business.name,
          icon: L.divIcon({
            className: 'business-marker',
            html: '<span aria-hidden="true">●</span>',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        })
          .addTo(map)
          .bindPopup(popup)
      }
      if (points.length === 1) map.setView(points[0], 15)
      else map.fitBounds(points, { padding: [35, 35], maxZoom: 15 })
      tiles.addTo(map)
    } catch {
      setStatus('error')
    }
    return () => {
      window.clearTimeout(timeout)
      map?.remove()
    }
    // Rebuild markers from this response only, never a separate business request.
  }, [businesses, attempt, navigate])

  return (
    <section
      className="mt-8 rounded-2xl border border-line bg-white p-5 sm:p-8"
      aria-label={title}
    >
      <h2 className="section-title text-2xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        {valid.length} vendndodhje nga {businesses.length} biznese. Koordinatat
        e paverifikuara nuk janë të konfirmuara. Profilet ilustruese pa koordinata nuk shfaqen në hartë.
      </p>
      {!valid.length ? (
        <p className="mt-5 text-muted">
          Vendndodhja nuk është në dispozicion. Nuk është vendosur pin i
          supozuar.
        </p>
      ) : (
        <>
          {status === 'loading' && (
            <p role="status" className="mt-4 text-sm">
              Duke ngarkuar hartën…
            </p>
          )}
          {status === 'error' && (
            <div role="alert" className="mt-4 rounded-xl bg-amber/20 p-4">
              <p>
                Harta nuk u ngarkua plotësisht. Adresa dhe kontaktet mbeten në
                dispozicion.
              </p>
              <button
                className="button-secondary mt-3"
                onClick={() => setAttempt(attempt + 1)}
              >
                Riprovo hartën
              </button>
            </div>
          )}
          <div
            ref={container}
            role="region"
            aria-label="Hartë interaktive e bizneseve"
            tabIndex="0"
            className="relative z-0 mt-5 h-80 w-full rounded-xl border border-line"
          />
        </>
      )}
    </section>
  )
}
