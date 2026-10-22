import { useEffect, useRef, useState } from 'react'
import { getJson, safeWebsite } from '../lib/api'
import Icon from './Icon'

export default function BusinessPreview({ slug, onClose }) {
  const dialog = useRef(null)
  const [business, setBusiness] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    dialog.current.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setBusiness(null)
    setError('')
    getJson('/api/businesses/' + encodeURIComponent(slug), controller.signal)
      .then(result => setBusiness(result.data))
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [slug, attempt])

  return (
    <dialog ref={dialog} aria-labelledby="business-preview-title" onCancel={onClose} onClose={onClose}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-paper p-0 text-ink shadow-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
        <p className="eyebrow">Përmbledhje e biznesit</p>
        <button type="button" className="icon-button" aria-label="Mbyll përmbledhjen" onClick={() => dialog.current.close()}><Icon name="close" /></button>
      </div>
      <div className="p-6 sm:p-9">
        <h2 id="business-preview-title" className="section-title">{business?.name || 'Biznesi'}</h2>
        {!business && !error && <p role="status" className="mt-6 text-muted">Duke ngarkuar të dhënat…</p>}
        {error && <div role="alert" className="mt-6"><p>{error}</p><button type="button" className="button-secondary mt-4" onClick={() => setAttempt(attempt + 1)}>Provo përsëri</button></div>}
        {business && <>
          <p className="mt-3 text-sm text-muted">{[business.category?.name, business.settlement?.name].filter(Boolean).join(' · ')}</p>
          {business.is_demo && <p className="mt-5 rounded-xl bg-amber/20 px-4 py-3 text-sm">Të dhëna demonstrimi. Kontaktet dhe vendndodhja nuk janë informacion i verifikuar.</p>}
          <p className="mt-6 whitespace-pre-line break-words leading-7 text-muted">{business.description || 'Përshkrimi nuk është publikuar.'}</p>
          {business.address && <p className="mt-6 flex gap-2 text-sm"><Icon name="pin" className="size-5 shrink-0" />{business.address}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {business.phone && <a className="button-primary" href={'tel:' + business.phone.replace(/[^+\d]/g, '')}>Telefono</a>}
            {safeWebsite(business.website) && <a className="button-secondary" href={safeWebsite(business.website)} target="_blank" rel="noopener noreferrer">Website i biznesit <Icon /></a>}
          </div>
        </>}
      </div>
    </dialog>
  )
}
