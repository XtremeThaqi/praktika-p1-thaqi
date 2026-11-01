import { useEffect, useState } from 'react'
import Link from '../components/Link'
import Icon from '../components/Icon'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'
import { placementLabels, statusLabels } from './AdminAdvertisementListPage'
import { previewAdvertisementDestination } from '../lib/advertisementDestination'
import { advertisementAltText } from '../lib/advertisementImage'

const emptyForm = {
  business_id: '', placement: 'home_banner', alt_text: '', destination: '',
  starts_at_local: '', ends_at_local: '', priority: 0, is_active: false,
}

const businessStatusLabels = {
  published: 'I publikuar',
  draft: 'Draft',
  archived: 'I arkivuar',
}

export default function AdminAdvertisementFormPage({ id, navigate, onLogout, onSessionExpired }) {
  const [form, setForm] = useState(emptyForm)
  const [businesses, setBusinesses] = useState(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [savedBusinessId, setSavedBusinessId] = useState(null)
  const [useExternal, setUseExternal] = useState(false)
  const [altTouched, setAltTouched] = useState(false)
  const [businessQuery, setBusinessQuery] = useState('')
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photoId, setPhotoId] = useState('')
  const [imageMode, setImageMode] = useState(id ? 'existing' : 'business')
  const [image, setImage] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageFailed, setImageFailed] = useState(false)
  const [storedImage, setStoredImage] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!image) { setPreviewUrl(''); return undefined }
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    setImageFailed(false)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => { setImageFailed(false) }, [photoId, imageMode])

  useEffect(() => {
    if (!id) return undefined
    let active = true
    setLoading(true)
    setError('')
    adminRequest(`/api/admin/advertisements/${id}`)
      .then(({ data }) => {
        if (!active) return
        setForm({
          business_id: data.business.id, placement: data.placement, alt_text: data.alt_text,
          destination: data.destination, starts_at_local: data.starts_at_local,
          ends_at_local: data.ends_at_local, priority: data.priority, is_active: data.is_active,
        })
        setSelectedBusiness(data.business)
        setSavedBusinessId(data.business.id)
        setUseExternal(Boolean(data.destination))
        setStoredImage(data.image_path)
        setImageMode('existing')
        setStatus(data.status)
        setLoading(false)
      })
      .catch((problem) => {
        if (!active) return
        if ([401, 403].includes(problem.status)) onSessionExpired()
        else { setError(problem.message); setLoading(false) }
      })
    return () => { active = false }
  }, [id, retry, onSessionExpired])

  useEffect(() => {
    let active = true
    setSearching(true)
    const query = businessQuery.trim()
    if (!selectorOpen) { setSearching(false); return undefined }
    adminRequest('/api/admin/businesses' + (query ? `?q=${encodeURIComponent(query)}` : ''))
      .then((result) => {
        if (active) { setBusinesses(result.data); setSearching(false) }
      })
      .catch((problem) => {
        if (!active) return
        setSearching(false)
        if ([401, 403].includes(problem.status)) onSessionExpired()
        else setError(problem.message)
      })
    return () => { active = false }
  }, [businessQuery, selectorOpen, retry, onSessionExpired])

  useEffect(() => {
    if (!form.business_id) { setPhotos([]); return undefined }
    let active = true
    adminRequest(`/api/admin/businesses/${form.business_id}`)
      .then(({ data }) => {
        if (!active) return
        const available = (data.images || []).filter((photo) => photo.kind === 'gallery')
        setPhotos(available)
        setPhotoId((current) => current && available.some((photo) => String(photo.id) === String(current)) ? current : String(available[0]?.id || ''))
        if (!id && !available.length) setImageMode('upload')
      })
      .catch((problem) => { if (active) report(problem) })
    return () => { active = false }
  }, [form.business_id, id])

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFeedback('')
  }

  function report(problem) {
    if ([401, 403].includes(problem.status)) { onSessionExpired(); return }
    setErrors(problem.errors || {})
    setError(Object.keys(problem.errors || {}).length ? '' : problem.message)
  }

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setErrors({})
    setError('')
    setFeedback('')
    try {
      const chosenPhoto = photos.find((photo) => String(photo.id) === String(photoId))
      const altText = (altTouched || (id && imageMode === 'existing')) && form.alt_text.trim()
        ? form.alt_text.trim() : advertisementAltText(selected?.name, imageMode, chosenPhoto?.alt_text)
      const payload = { ...form, alt_text: altText }
      const needsImage = !id || imageMode !== 'existing'
      if (!form.business_id) { setErrors({ business_id: ['Zgjidhni biznesin.'] }); return }
      if (needsImage && !(imageMode === 'business' && photoId) && !(imageMode === 'upload' && image)) {
        setErrors({ image: ['Zgjidhni një fotografi të biznesit ose ngarkoni një banner.'] })
        return
      }
      let options
      if (id) {
        const changingBusiness = String(savedBusinessId) !== String(form.business_id)
        options = { method: 'PUT', body: JSON.stringify(changingBusiness ? { ...payload, is_active: false } : payload) }
      } else {
        const body = new FormData()
        Object.entries(payload).forEach(([key, value]) => body.set(key, key === 'is_active' ? (value ? '1' : '0') : String(value)))
        if (imageMode === 'upload' && image) body.set('image', image)
        if (imageMode === 'business' && photoId) body.set('business_image_id', photoId)
        options = { method: 'POST', body }
      }
      await adminRequest(`/api/admin/advertisements${id ? `/${id}` : ''}`, options)
      if (id && needsImage) {
        const body = new FormData()
        if (imageMode === 'upload') body.set('image', image)
        else body.set('business_image_id', photoId)
        try {
          await adminRequest(`/api/admin/advertisements/${id}/image`, { method: 'POST', body })
        } catch (problem) {
          report(problem)
          setFeedback('Të dhënat u ruajtën, por imazhi nuk u ndryshua. Provoni përsëri.')
          return
        }
      }
      if (id && String(savedBusinessId) !== String(form.business_id) && form.is_active) {
        await adminRequest(`/api/admin/advertisements/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
      }
      navigate('/admin/advertisements')
    } catch (problem) {
      report(problem)
    } finally {
      setSaving(false)
    }
  }

  const businessOptions = businesses || []
  const selected = businessOptions.find((business) => String(business.id) === String(form.business_id))
    || (String(selectedBusiness?.id) === String(form.business_id) ? selectedBusiness : null)
  const chosenPhoto = photos.find((photo) => String(photo.id) === String(photoId))
  const visibleImage = imageMode === 'business' ? chosenPhoto?.path : imageMode === 'upload' ? previewUrl : storedImage
  const previewAlt = (altTouched || (id && imageMode === 'existing')) && form.alt_text.trim()
    ? form.alt_text.trim() : advertisementAltText(selected?.name, imageMode, chosenPhoto?.alt_text)
  const fieldError = (field) => errors[field]?.[0]

  const statusText = status ? statusLabels[status] || 'Në pritje të publikimit' : 'Draft i ri'
  const placementText = placementLabels[form.placement]
  const selectedName = selected?.name || 'Emri i biznesit'
  const effectiveDestination = previewAdvertisementDestination(form.destination, selected)
  const internalDestination = effectiveDestination.startsWith('/bizneset/')
  const externalDestination = /^https?:\/\//i.test(effectiveDestination)

  function chooseBusiness(business) {
    const changed = String(form.business_id) !== String(business.id)
    change('business_id', business.id)
    setSelectedBusiness(business)
    setSelectorOpen(false)
    setBusinessQuery('')
    if (changed) {
      setImageMode('business')
      setPhotoId('')
      setPhotos([])
      setImage(null)
      change('alt_text', '')
      setAltTouched(false)
    }
  }

  return <AdminLayout title={id ? 'Ndrysho reklamën' : 'Shto reklamë'} current="advertisements" navigate={navigate} onLogout={onLogout}>
    <Link href="/admin/advertisements" navigate={navigate} className="mt-5 inline-block font-semibold text-forest underline">← Kthehu te reklamat</Link>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
      {error} {id && loading && <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>}
    </div>}
    {feedback && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">{feedback}</p>}
    {loading ? <p role="status" className="mt-6">Duke ngarkuar reklamën…</p> : <>
      <form onSubmit={save} className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:items-start">
        <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
          <section aria-labelledby="business-section-title" className="grid gap-4">
            <p id="business-section-title" className="eyebrow text-forest">01 · Biznesi</p>
            {selected && <p className="rounded-xl border border-line bg-cream p-4 font-semibold">{selected.name} · {businessStatusLabels[selected.status] || 'Gjendje e panjohur'}</p>}
            <button type="button" className="button-secondary w-fit" aria-expanded={selectorOpen} aria-controls="business-choices" onClick={() => setSelectorOpen((open) => !open)}>{selected ? 'Ndrysho biznesin' : 'Zgjidh biznesin'}</button>
            {selectorOpen && <div id="business-choices" className="rounded-xl border border-line p-3">
              <label htmlFor="business-search" className="text-sm font-semibold">Emri i biznesit</label>
              <input id="business-search" autoFocus className="field mt-2" value={businessQuery} onChange={(event) => setBusinessQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); document.querySelector('#business-choices [role="option"]')?.focus() } }} placeholder="Shkruani emrin…" />
              {searching ? <p role="status" className="mt-3 text-sm">Duke kërkuar…</p> : businessOptions.length ? <div className="mt-3 max-h-52 overflow-y-auto" role="listbox" aria-label="Bizneset e gjetura">{businessOptions.map((business) => <button key={business.id} type="button" role="option" aria-selected={String(form.business_id) === String(business.id)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-cream focus-visible:outline-2 focus-visible:outline-forest" onKeyDown={(event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); const next = event.key === 'ArrowDown' ? event.currentTarget.nextElementSibling : event.currentTarget.previousElementSibling; next?.focus() } }} onClick={() => chooseBusiness(business)}>{business.name} · {businessStatusLabels[business.status] || 'Gjendje e panjohur'}</button>)}</div> : <p className="mt-3 text-sm text-muted">Nuk u gjet asnjë biznes.</p>}
            </div>}
            {fieldError('business_id') && <p className="text-sm text-red-900">{fieldError('business_id')}</p>}
            {selected && selected.status !== 'published' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Ky biznes nuk është i publikuar. Reklama nuk shfaqet publikisht derisa biznesi të publikohet.</p>}
          </section>

          <section aria-labelledby="image-section-title" className="grid gap-4 border-t border-line pt-6">
            <p id="image-section-title" className="eyebrow text-forest">02 · Pamja dhe vendosja</p>
            {id && <label className="flex items-center gap-2 text-sm"><input type="radio" name="image-mode" checked={imageMode === 'existing'} onChange={() => setImageMode('existing')} /> Mbaj imazhin aktual</label>}
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="image-mode" checked={imageMode === 'business'} disabled={!photos.length} onChange={() => setImageMode('business')} /> Përdor fotografinë e biznesit</label>
            {imageMode === 'business' && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo) => <button key={photo.id} type="button" aria-pressed={String(photoId) === String(photo.id)} onClick={() => setPhotoId(String(photo.id))} className={`rounded-xl border p-2 focus-visible:outline-2 focus-visible:outline-forest ${String(photoId) === String(photo.id) ? 'border-forest' : 'border-line'}`}><img src={photo.path} alt={photo.alt_text || 'Fotografi e biznesit'} className="h-20 w-full rounded-lg object-cover" /></button>)}</div>}
            {selected && !photos.length && <p className="text-sm text-muted">Ky biznes nuk ka fotografi të përdorshme. Ngarkoni një banner të veçantë.</p>}
            <label className="flex items-center gap-2 text-sm"><input type="radio" name="image-mode" checked={imageMode === 'upload'} onChange={() => setImageMode('upload')} /> Ngarko banner të veçantë</label>
            {imageMode === 'upload' && <label htmlFor="ad-image" className="block rounded-xl border border-dashed border-line p-4 text-sm">JPG, PNG ose WebP deri në 5 MB. {image?.name || 'Zgjidhni skedarin'}<input id="ad-image" className="mt-2 block w-full" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setImage(event.target.files?.[0] || null); setErrors((current) => ({ ...current, image: undefined })) }} /></label>}
            {(fieldError('image') || fieldError('business_image_id')) && <p className="text-sm text-red-900">{fieldError('image') || fieldError('business_image_id')}</p>}
          </section>

          <fieldset className="grid gap-4 border-t border-line pt-6" aria-labelledby="placement-section-title">
            <legend id="placement-section-title" className="text-sm font-semibold text-forest">Vendosja</legend><p className="-mt-2 text-sm text-muted">Zgjidhni hapësirën ku do të shfaqet reklama.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(placementLabels).map(([value, label]) => <button key={value} type="button" className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-forest ${form.placement === value ? 'border-forest bg-[#edf2e9] shadow-sm' : 'border-line bg-cream'}`} aria-pressed={form.placement === value} onClick={() => change('placement', value)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-xl text-[#eec461]" aria-hidden="true">{value === 'home_banner' ? '▰' : '▤'}</span>
                <span className="mt-3 block font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{value === 'home_banner' ? 'Ballina kryesore' : 'Pranë listës së rezultateve'}</span>
              </button>)}
            </div>
            {fieldError('placement') && <span className="text-sm text-red-900">{fieldError('placement')}</span>}
          </fieldset>

          <section aria-labelledby="schedule-section-title" className="grid gap-4 border-t border-line pt-6">
            <div><p id="schedule-section-title" className="eyebrow text-forest">03 · Kohëzgjatja</p><p className="mt-1 text-sm text-muted">Reklama shfaqet vetëm kur është e aktivizuar, biznesi është i publikuar dhe data aktuale është brenda intervalit të caktuar. Orët janë sipas Lipjanit.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Fillon më *<input className="field mt-2 min-w-0" type="datetime-local" value={form.starts_at_local} required onChange={(event) => change('starts_at_local', event.target.value)} aria-invalid={Boolean(fieldError('starts_at_local'))} />{fieldError('starts_at_local') && <span className="mt-2 block text-red-900">{fieldError('starts_at_local')}</span>}</label>
              <label className="text-sm font-semibold">Përfundon më *<input className="field mt-2 min-w-0" type="datetime-local" value={form.ends_at_local} required onChange={(event) => change('ends_at_local', event.target.value)} aria-invalid={Boolean(fieldError('ends_at_local'))} />{fieldError('ends_at_local') && <span className="mt-2 block text-red-900">{fieldError('ends_at_local')}</span>}</label>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(event) => change('is_active', event.target.checked)} /> Aktivizo reklamën</label>
          </section>

          <details className="rounded-2xl border border-line bg-cream p-4">
            <summary className="font-semibold">Cilësime shtesë</summary>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold">Përshkrimi i imazhit <span className="font-normal text-muted">(plotësohet automatikisht)</span><input className="field mt-2" value={altTouched || imageMode === 'existing' ? form.alt_text : ''} placeholder={advertisementAltText(selected?.name, imageMode, chosenPhoto?.alt_text)} maxLength="255" onChange={(event) => { setAltTouched(true); change('alt_text', event.target.value) }} aria-invalid={Boolean(fieldError('alt_text'))} />{fieldError('alt_text') && <span className="mt-2 block text-red-900">{fieldError('alt_text')}</span>}</label>
              <p className="text-sm text-muted">Kur vizitori klikon reklamën, hapet profili i biznesit.</p>
              <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={useExternal} onChange={(event) => { setUseExternal(event.target.checked); if (!event.target.checked) change('destination', '') }} /> Çoje vizitorin në një faqe tjetër</label>
              {useExternal && <label className="text-sm font-semibold">Adresa e faqes<input className="field mt-2" type="url" value={form.destination} required onChange={(event) => change('destination', event.target.value)} aria-invalid={Boolean(fieldError('destination'))} />{fieldError('destination') && <span className="mt-2 block text-red-900">{fieldError('destination')}</span>}</label>}
              <label className="text-sm font-semibold">Përparësia e reklamës<input className="field mt-2" type="number" min="0" max="65535" step="1" value={form.priority} required onChange={(event) => change('priority', event.target.value)} aria-invalid={Boolean(fieldError('priority'))} />{fieldError('priority') && <span className="mt-2 block text-red-900">{fieldError('priority')}</span>}</label>
              <p className="text-xs text-muted">Kur disa reklama janë aktive në të njëjtin pozicion, shfaqet ajo me përparësinë më të lartë.</p>
            </div>
          </details>

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Duke ruajtur…' : id ? 'Ruaj ndryshimet' : 'Krijo reklamën'}</button>
            <Link href="/admin/advertisements" navigate={navigate} className="button-secondary">Anulo</Link>
          </div>
        </div>

        <aside aria-label="Pamja paraprake" className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl border border-[#d9c9a9] bg-[#f2ead9] shadow-[0_18px_45px_rgba(23,63,53,0.12)]">
            <div className="flex items-center justify-between border-b border-[#dfd1b7] px-5 py-4"><p className="eyebrow text-[#765016]">Pamje paraprake</p><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#765016]">{statusText}</span></div>
            <div className="flex min-h-52 items-center justify-center bg-white/35 p-5">
              {visibleImage && !imageFailed ? <img className="mt-0 max-h-44 w-full rounded-lg object-contain" src={visibleImage} alt={previewAlt} onError={() => setImageFailed(true)} /> : <div className="flex min-h-44 w-full items-center justify-center bg-[radial-gradient(circle_at_22%_22%,#557c63_0,#173f35_48%,#102f29_100%)] p-6 text-center text-white"><div><span className="inline-flex rounded-full bg-[#eec461] px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest">{placementText}</span><p className="mt-4 font-display text-2xl leading-tight">Imazhi i reklamës</p><p className="mt-2 text-sm text-white/75">Zgjidhni një imazh për ta parë këtu.</p></div></div>}
            </div>
            <div className="p-5"><p className="eyebrow text-[#765016]">Reklamë {selected?.is_demo && '· Demonstrim'}</p><p className="mt-4 font-semibold">{selectedName}</p>{selected?.is_demo && <p className="mt-2 text-sm leading-6 text-muted">Hapësirë reklamuese me të dhëna të simuluara. Nuk është rekomandim i platformës.</p>}<div className="mt-4">{internalDestination ? <span className="button-secondary pointer-events-none">Shiko profilin e biznesit <Icon /></span> : selected?.is_demo ? <span className="button-secondary pointer-events-none">Shiko biznesin demo <Icon /></span> : externalDestination ? <span className="button-secondary pointer-events-none">Hap reklamën <Icon /></span> : <span className="text-sm text-muted">CTA do të shfaqet pas zgjedhjes së destinacionit.</span>}</div><p className="mt-4 text-xs text-muted">Pamje paraprake — nuk publikohet pa ruajtur formularin.</p></div>
          </div>
        </aside>
      </form>
    </>}
  </AdminLayout>
}
