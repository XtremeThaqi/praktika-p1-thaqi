import { useEffect, useState } from 'react'
import Link from '../components/Link'
import Icon from '../components/Icon'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'
import { placementLabels, statusLabels } from './AdminAdvertisementListPage'

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
  const [useExternal, setUseExternal] = useState(false)
  const [businessQuery, setBusinessQuery] = useState('')
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
  const [uploading, setUploading] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!image) { setPreviewUrl(''); return undefined }
    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    setImageFailed(false)
    return () => URL.revokeObjectURL(url)
  }, [image])

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
        setUseExternal(Boolean(data.destination))
        setStoredImage(data.image_path)
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
    adminRequest('/api/admin/businesses' + (query ? `?q=${encodeURIComponent(query)}` : '?status=published'))
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
  }, [businessQuery, retry, onSessionExpired])

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
      const altText = form.alt_text.trim() || `${selected?.name || 'Reklamë'} - imazh reklamues`
      const payload = { ...form, alt_text: altText }
      let options
      if (id) {
        options = { method: 'PUT', body: JSON.stringify(payload) }
      } else {
        const body = new FormData()
        Object.entries(payload).forEach(([key, value]) => body.set(key, key === 'is_active' ? (value ? '1' : '0') : String(value)))
        if (image) body.set('image', image)
        options = { method: 'POST', body }
      }
      await adminRequest(`/api/admin/advertisements${id ? `/${id}` : ''}`, options)
      navigate('/admin/advertisements')
    } catch (problem) {
      report(problem)
    } finally {
      setSaving(false)
    }
  }

  async function replaceImage() {
    if (!id || !image || uploading) return
    setUploading(true)
    setErrors({})
    setError('')
    setFeedback('')
    const body = new FormData()
    body.set('image', image)
    try {
      const { data } = await adminRequest(`/api/admin/advertisements/${id}/image`, { method: 'POST', body })
      setStoredImage(data.image_path)
      setImage(null)
      setImageFailed(false)
      setFeedback('Imazhi u zëvendësua.')
    } catch (problem) {
      report(problem)
    } finally {
      setUploading(false)
    }
  }

  const businessOptions = businesses || []
  const hasCurrent = selectedBusiness && !businessOptions.some((business) => business.id === selectedBusiness.id)
  const selected = businessOptions.find((business) => String(business.id) === String(form.business_id))
    || (String(selectedBusiness?.id) === String(form.business_id) ? selectedBusiness : null)
  const visibleImage = previewUrl || storedImage
  const fieldError = (field) => errors[field]?.[0]

  const statusText = status ? statusLabels[status] || 'Në pritje të publikimit' : 'Draft i ri'
  const placementText = placementLabels[form.placement]
  const selectedName = selected?.name || 'Emri i biznesit'
  const internalDestination = form.destination?.startsWith('/bizneset/')
  const externalDestination = /^https?:\/\//i.test(form.destination || '')

  return <AdminLayout title={id ? 'Ndrysho reklamën' : 'Shto reklamë'} current="advertisements" navigate={navigate} onLogout={onLogout}>
    <Link href="/admin/advertisements" navigate={navigate} className="mt-5 inline-block font-semibold text-forest underline">← Kthehu te reklamat</Link>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
      {error} {id && loading && <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>}
    </div>}
    {feedback && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">{feedback}</p>}
    {loading ? <p role="status" className="mt-6">Duke ngarkuar reklamën…</p> : <>
      <p className="mt-5 max-w-3xl text-sm text-muted">Orari vendoset sipas zonës së Lipjanit (Europe/Belgrade). Zgjidhni intervalin kur reklama duhet të jetë aktive.</p>
      <form onSubmit={save} className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:items-start">
        <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 sm:p-7">
          <section aria-labelledby="business-section-title" className="grid gap-4">
            <div><p id="business-section-title" className="eyebrow text-forest">01 · Zgjedhja e biznesit</p><p className="mt-1 text-sm text-muted">Lidhni reklamën me një biznes nga katalogu.</p></div>
            <div>
              <label htmlFor="business-search" className="text-sm font-semibold">Kërko biznesin</label>
              <input id="business-search" className="field mt-2" value={businessQuery} onChange={(event) => setBusinessQuery(event.target.value)} placeholder="Kërko sipas emrit…" />
              <p className="mt-2 text-xs text-muted">Pa kërkim shfaqen bizneset e publikuara; kërkimi përfshin edhe draftet.</p>
              {searching && <p role="status" className="mt-2 text-xs">Duke kërkuar…</p>}
            </div>
            <label className="text-sm font-semibold">Biznesi *
              <select className="field mt-2" value={form.business_id} required onChange={(event) => {
                const next = businessOptions.find((business) => String(business.id) === event.target.value) || null
                change('business_id', event.target.value)
                setSelectedBusiness(next)
                if (next && !form.alt_text) change('alt_text', `${next.name} - imazh reklamues`)
              }} aria-invalid={Boolean(fieldError('business_id'))}>
                <option value="">Zgjidhni biznesin</option>
                {hasCurrent && <option value={selectedBusiness.id}>{selectedBusiness.name} · {businessStatusLabels[selectedBusiness.status] || 'Gjendje e panjohur'}</option>}
                {businessOptions.map((business) => <option key={business.id} value={business.id}>{business.name} · {businessStatusLabels[business.status] || 'Gjendje e panjohur'}</option>)}
              </select>
              {fieldError('business_id') && <span className="mt-2 block text-red-900">{fieldError('business_id')}</span>}
            </label>
            {selected && selected.status !== 'published' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Ky biznes nuk është i publikuar. Reklama nuk shfaqet publikisht derisa biznesi të publikohet.</p>}
          </section>

          <fieldset className="grid gap-4 border-t border-line pt-6" aria-labelledby="placement-section-title">
            <legend id="placement-section-title" className="eyebrow text-forest">02 · Vendosja</legend><p className="-mt-2 text-sm text-muted">Zgjidhni hapësirën ku do të shfaqet reklama.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(placementLabels).map(([value, label]) => <button key={value} type="button" className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-forest ${form.placement === value ? 'border-forest bg-[#edf2e9] shadow-sm' : 'border-line bg-cream'}`} aria-pressed={form.placement === value} onClick={() => change('placement', value)}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-forest text-xl text-[#eec461]" aria-hidden="true">{value === 'home_banner' ? '▰' : '▤'}</span>
                <span className="mt-3 block font-semibold">{label}</span><span className="mt-1 block text-xs text-muted">{value === 'home_banner' ? 'Ballina kryesore' : 'Pranë listës së rezultateve'}</span>
              </button>)}
            </div>
            {fieldError('placement') && <span className="text-sm text-red-900">{fieldError('placement')}</span>}
          </fieldset>

          <section aria-labelledby="image-section-title" className="grid gap-4 border-t border-line pt-6">
            <div><p id="image-section-title" className="eyebrow text-forest">03 · Imazhi i reklamës</p><p className="mt-1 text-sm text-muted">Ngarkoni një imazh JPG, PNG ose WebP deri në 5 MB.</p></div>
            <label htmlFor="ad-image" className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b8c6b8] bg-[#f5f7f1] px-5 py-6 text-center transition hover:border-forest hover:bg-[#edf2e9] focus-within:ring-2 focus-within:ring-forest">
              <span className="flex size-11 items-center justify-center rounded-full bg-forest text-xl text-[#eec461]" aria-hidden="true">↑</span>
              <span className="mt-3 font-semibold text-forest">{image ? image.name : id ? 'Zgjidhni imazh të ri' : 'Zgjidhni imazhin e reklamës'}</span>
              <span className="mt-1 text-xs text-muted">Klikoni për të kërkuar një skedar në pajisjen tuaj</span>
              <input id="ad-image" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" required={!id} onChange={(event) => { setImage(event.target.files?.[0] || null); setErrors((current) => ({ ...current, image: undefined })) }} />
            </label>
            {fieldError('image') && <p className="text-sm text-red-900">{fieldError('image')}</p>}
            {id && <button type="button" className="button-secondary w-fit" disabled={!image || uploading || saving} onClick={replaceImage}>{uploading ? 'Duke ngarkuar…' : 'Ruaj imazhin e ri'}</button>}
          </section>

          <section aria-labelledby="schedule-section-title" className="grid gap-4 border-t border-line pt-6">
            <div><p id="schedule-section-title" className="eyebrow text-forest">04 · Planifikimi</p><p className="mt-1 text-sm text-muted">Vendosni kur fillon dhe mbaron shfaqja. Orët interpretohen sipas zonës së Lipjanit.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Fillimi *<input className="field mt-2 min-w-0" type="datetime-local" value={form.starts_at_local} required onChange={(event) => change('starts_at_local', event.target.value)} aria-invalid={Boolean(fieldError('starts_at_local'))} />{fieldError('starts_at_local') && <span className="mt-2 block text-red-900">{fieldError('starts_at_local')}</span>}</label>
              <label className="text-sm font-semibold">Mbarimi *<input className="field mt-2 min-w-0" type="datetime-local" value={form.ends_at_local} required onChange={(event) => change('ends_at_local', event.target.value)} aria-invalid={Boolean(fieldError('ends_at_local'))} />{fieldError('ends_at_local') && <span className="mt-2 block text-red-900">{fieldError('ends_at_local')}</span>}</label>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.is_active} onChange={(event) => change('is_active', event.target.checked)} /> Aktivizo reklamën pas ruajtjes</label>
          </section>

          <details className="rounded-2xl border border-line bg-cream p-4">
            <summary className="font-semibold">Cilësime të avancuara</summary>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold">Teksti alternativ <span className="font-normal text-muted">(plotësohet automatikisht)</span><input className="field mt-2" value={form.alt_text} maxLength="255" onChange={(event) => change('alt_text', event.target.value)} aria-invalid={Boolean(fieldError('alt_text'))} />{fieldError('alt_text') && <span className="mt-2 block text-red-900">{fieldError('alt_text')}</span>}</label>
              <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={useExternal} onChange={(event) => { setUseExternal(event.target.checked); if (!event.target.checked) change('destination', '') }} /> Përdor lidhje të jashtme</label>
              {useExternal ? <label className="text-sm font-semibold">Lidhje HTTP(S)<input className="field mt-2" type="url" value={form.destination} required onChange={(event) => change('destination', event.target.value)} aria-invalid={Boolean(fieldError('destination'))} />{fieldError('destination') && <span className="mt-2 block text-red-900">{fieldError('destination')}</span>}</label> : <p className="text-sm text-muted">Klikimi hap profilin e ruajtur të biznesit.</p>}
              <label className="text-sm font-semibold">Prioriteti (0–65535)<input className="field mt-2" type="number" min="0" max="65535" step="1" value={form.priority} required onChange={(event) => change('priority', event.target.value)} aria-invalid={Boolean(fieldError('priority'))} />{fieldError('priority') && <span className="mt-2 block text-red-900">{fieldError('priority')}</span>}</label>
            </div>
          </details>

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <button type="submit" className="button-primary" disabled={saving || uploading}>{saving ? 'Duke ruajtur…' : id ? 'Ruaj ndryshimet' : 'Krijo reklamën'}</button>
            <Link href="/admin/advertisements" navigate={navigate} className="button-secondary">Anulo</Link>
          </div>
        </div>

        <aside aria-label="Pamja paraprake" className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-3xl border border-[#d9c9a9] bg-[#f2ead9] shadow-[0_18px_45px_rgba(23,63,53,0.12)]">
            <div className="flex items-center justify-between border-b border-[#dfd1b7] px-5 py-4"><p className="eyebrow text-[#765016]">Pamje paraprake</p><span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#765016]">{statusText}</span></div>
            <div className="flex min-h-52 items-center justify-center bg-white/35 p-5">
              {visibleImage && !imageFailed ? <img className="mt-0 max-h-44 w-full rounded-lg object-contain" src={visibleImage} alt={form.alt_text || `Reklamë e ${selectedName}`} onError={() => setImageFailed(true)} /> : <div className="flex min-h-44 w-full items-center justify-center rounded-lg bg-[radial-gradient(circle_at_22%_22%,#557c63_0,#173f35_48%,#102f29_100%)] p-6 text-center text-white"><div><span className="inline-flex rounded-full bg-[#eec461] px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest">{placementText}</span><p className="mt-4 font-display text-2xl leading-tight">Imazhi i reklamës</p><p className="mt-2 text-sm text-white/75">Zgjidhni një imazh për ta parë këtu.</p></div></div>}
            </div>
            <div className="p-5"><p className="eyebrow text-[#765016]">Reklamë {selected?.is_demo && '· Demonstrim'}</p><p className="mt-4 font-semibold">{selectedName}</p>{selected?.is_demo && <p className="mt-2 text-sm leading-6 text-muted">Hapësirë reklamuese me të dhëna të simuluara. Nuk është rekomandim i platformës.</p>}<div className="mt-4">{internalDestination ? <span className="button-secondary pointer-events-none">Shiko profilin e biznesit <Icon /></span> : selected?.is_demo ? <span className="button-secondary pointer-events-none">Shiko biznesin demo <Icon /></span> : externalDestination ? <span className="button-secondary pointer-events-none">Hap reklamën <Icon /></span> : <span className="text-sm text-muted">CTA do të shfaqet pas zgjedhjes së destinacionit.</span>}</div><p className="mt-4 text-xs text-muted">Pamje paraprake — nuk publikohet pa ruajtur formularin.</p></div>
          </div>
        </aside>
      </form>
    </>}
  </AdminLayout>
}
