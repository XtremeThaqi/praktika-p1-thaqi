import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { mapPoint, validPoint } from '../lib/businessForm'

const lipjan = [42.5213, 21.1226]
const pinIcon = L.divIcon({
  className: 'business-marker', html: '<span aria-hidden="true">●</span>',
  iconSize: [30, 30], iconAnchor: [15, 15],
})

export default function BusinessLocationPicker({ latitude, longitude, onChange }) {
  const container = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const change = useRef(onChange)
  const [attempt, setAttempt] = useState(0)
  const [tileError, setTileError] = useState(false)
  change.current = onChange
  const lat = Number(latitude)
  const lng = Number(longitude)
  const hasPoint = validPoint(latitude, longitude)

  useEffect(() => {
    if (!container.current) return undefined
    let active = true
    let timeout
    const instance = L.map(container.current, { scrollWheelZoom: false })
    map.current = instance
    instance.setView(hasPoint ? [lat, lng] : lipjan, hasPoint ? 16 : 12)
    instance.on('click', (event) => change.current(...mapPoint(event.latlng)))
    const tiles = L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    })
    tiles.on('tileerror', () => { if (active) setTileError(true) })
    tiles.on('load', () => { if (active) { window.clearTimeout(timeout); setTileError(false) } })
    timeout = window.setTimeout(() => { if (active) setTileError(true) }, 15000)
    tiles.addTo(instance)
    window.requestAnimationFrame(() => instance.invalidateSize())
    return () => {
      active = false
      window.clearTimeout(timeout)
      marker.current = null
      map.current = null
      instance.remove()
    }
    // A retry rebuilds tile listeners; coordinate edits update the marker below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  useEffect(() => {
    if (!map.current) return
    if (!hasPoint) {
      marker.current?.remove()
      marker.current = null
      return
    }
    if (!marker.current) {
      marker.current = L.marker([lat, lng], { draggable: true, icon: pinIcon, title: 'Vendndodhja e biznesit' }).addTo(map.current)
      marker.current.on('dragend', () => {
        const point = marker.current.getLatLng()
        change.current(...mapPoint(point))
      })
    } else marker.current.setLatLng([lat, lng])
  }, [latitude, longitude, hasPoint, lat, lng, attempt])

  return <div>
    <p className="mb-3 text-sm text-muted">Klikoni hartën për pin-in e biznesit; tërhiqeni pin-in për ta korrigjuar. Zgjedhja nuk e verifikon adresën.</p>
    {tileError && <div role="alert" className="mb-3 rounded-xl bg-amber/20 p-3 text-sm">
      Harta nuk u ngarkua plotësisht. Koordinatat manuale mbeten të përdorshme.
      <button type="button" className="ml-2 font-semibold underline" onClick={() => { setTileError(false); setAttempt((value) => value + 1) }}>Riprovo hartën</button>
    </div>}
    <div ref={container} role="region" aria-label="Zgjidh vendndodhjen në hartë" className="relative z-0 h-72 w-full rounded-xl border border-line sm:h-80" />
    <p className="mt-2 text-xs text-muted">Harta përdor OpenStreetMap. Për përdorim me tastierë, hapni koordinatat manuale më poshtë.</p>
  </div>
}
