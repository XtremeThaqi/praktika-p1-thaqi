import { useEffect, useState } from 'react'
import Link from '../components/Link'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'
import { placementLabels, statusLabels } from './AdminAdvertisementListPage'

const emptyForm = {
  business_id: '', placement: 'home_banner', alt_text: '', destination: '',
  starts_at_local: '', ends_at_local: '', priority: 0, is_active: false,
}

export default function AdminAdvertisementFormPage({ id, navigate, onLogout, onSessionExpired }) {
  const [form, setForm] = useState(emptyForm)
  const [businesses, setBusinesses] = useState(null)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
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
      let options
      if (id) {
        options = { method: 'PUT', body: JSON.stringify(form) }
      } else {
        const body = new FormData()
        Object.entries(form).forEach(([key, value]) => body.set(key, key === 'is_active' ? (value ? '1' : '0') : String(value)))
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

  return <AdminLayout title={id ? 'Ndrysho reklamën' : 'Shto reklamë'} current="advertisements" navigate={navigate} onLogout={onLogout}>
    <Link href="/admin/advertisements" navigate={navigate} className="mt-5 inline-block font-semibold text-forest underline">← Kthehu te reklamat</Link>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
      {error} {id && loading && <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>}
    </div>}
    {feedback && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">{feedback}</p>}
    {loading ? <p role="status" className="mt-6">Duke ngarkuar reklamën…</p> : <>
      <p className="mt-5 text-sm text-muted">Orët futen sipas Europe/Belgrade (Lipjan). Koha e paqartë gjatë ndërrimit të orës verore refuzohet.</p>
      <form onSubmit={save} className="mt-6 space-y-7 rounded-2xl border border-line bg-white p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="business-search" className="text-sm font-semibold">Kërko biznesin</label>
            <input id="business-search" className="field mt-2" value={businessQuery} onChange={(event) => setBusinessQuery(event.target.value)}
              placeholder="Shkruani emrin për të kërkuar edhe draftet dhe arkivat" />
            <p className="mt-2 text-xs text-muted">Pa kërkim shfaqen bizneset e publikuara. Kërkimi shfaq 12 përputhjet e para.</p>
            {searching && <p role="status" className="mt-2 text-xs">Duke kërkuar…</p>}
          </div>
          <label className="min-w-0 text-sm font-semibold">Biznesi *
            <select className="field mt-2" value={form.business_id} required onChange={(event) => {
              change('business_id', event.target.value)
              setSelectedBusiness(businessOptions.find((business) => String(business.id) === event.target.value) || null)
            }} aria-invalid={Boolean(fieldError('business_id'))}>
              <option value="">Zgjidhni biznesin</option>
              {hasCurrent && <option value={selectedBusiness.id}>{selectedBusiness.name} · {selectedBusiness.status}</option>}
              {businessOptions.map((business) => <option key={business.id} value={business.id}>{business.name} · {business.status}</option>)}
            </select>
            {fieldError('business_id') && <span className="mt-2 block text-red-900">{fieldError('business_id')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Pozicioni *
            <select className="field mt-2" value={form.placement} onChange={(event) => change('placement', event.target.value)}>
              {Object.entries(placementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            {fieldError('placement') && <span className="mt-2 block text-red-900">{fieldError('placement')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Teksti alternativ i imazhit *
            <input className="field mt-2" value={form.alt_text} maxLength="255" required onChange={(event) => change('alt_text', event.target.value)} aria-invalid={Boolean(fieldError('alt_text'))} />
            {fieldError('alt_text') && <span className="mt-2 block text-red-900">{fieldError('alt_text')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Destinacioni HTTP(S) *
            <input className="field mt-2" type="url" value={form.destination} required onChange={(event) => change('destination', event.target.value)} aria-invalid={Boolean(fieldError('destination'))} />
            {fieldError('destination') && <span className="mt-2 block text-red-900">{fieldError('destination')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Fillimi · ora e Lipjanit *
            <input className="field mt-2 min-w-0" type="datetime-local" value={form.starts_at_local} required onChange={(event) => change('starts_at_local', event.target.value)} aria-invalid={Boolean(fieldError('starts_at_local'))} />
            {fieldError('starts_at_local') && <span className="mt-2 block text-red-900">{fieldError('starts_at_local')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Mbarimi · ora e Lipjanit *
            <input className="field mt-2 min-w-0" type="datetime-local" value={form.ends_at_local} required onChange={(event) => change('ends_at_local', event.target.value)} aria-invalid={Boolean(fieldError('ends_at_local'))} />
            {fieldError('ends_at_local') && <span className="mt-2 block text-red-900">{fieldError('ends_at_local')}</span>}
          </label>
          <label className="min-w-0 text-sm font-semibold">Prioriteti (0–65535) *
            <input className="field mt-2" type="number" min="0" max="65535" step="1" value={form.priority} required onChange={(event) => change('priority', event.target.value)} aria-invalid={Boolean(fieldError('priority'))} />
            {fieldError('priority') && <span className="mt-2 block text-red-900">{fieldError('priority')}</span>}
          </label>
          <label className="flex items-center gap-3 self-end text-sm font-semibold">
            <input type="checkbox" checked={form.is_active} onChange={(event) => change('is_active', event.target.checked)} />
            E aktivizuar
          </label>
        </div>
        {selected && selected.status !== 'published' && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">Ky biznes nuk është i publikuar. Reklama nuk shfaqet publikisht edhe nëse aktivizohet.</p>}
        <section aria-label="Imazhi i reklamës" className="border-t border-line pt-6">
          <label className="block text-sm font-semibold">{id ? 'Zëvendëso imazhin' : 'Imazhi JPG, PNG ose WebP · deri në 5 MB *'}
            <input className="field mt-2 min-w-0" type="file" accept="image/jpeg,image/png,image/webp" required={!id}
              onChange={(event) => { setImage(event.target.files?.[0] || null); setErrors((current) => ({ ...current, image: undefined })) }} />
          </label>
          {fieldError('image') && <p className="mt-2 text-sm text-red-900">{fieldError('image')}</p>}
          {id && <button type="button" className="button-secondary mt-3" disabled={!image || uploading || saving} onClick={replaceImage}>
            {uploading ? 'Duke ngarkuar…' : 'Ruaj imazhin e ri'}
          </button>}
        </section>
        <section aria-label="Pamja paraprake" className="rounded-2xl border border-line bg-[#f2ead9] p-5">
          <p className="eyebrow text-[#765016]">Reklamë {selected?.is_demo ? '· Demonstrim' : ''}</p>
          {visibleImage && !imageFailed ? <img className="mt-4 max-h-44 w-full rounded-lg object-contain" src={visibleImage} alt={form.alt_text || 'Pamje paraprake'} onError={() => setImageFailed(true)} />
            : <p className="mt-4 text-sm text-muted">{imageFailed ? 'Imazhi nuk mund të shfaqet.' : 'Zgjidhni një imazh për pamjen paraprake.'}</p>}
          <p className="mt-4 font-semibold">{selected?.name || 'Zgjidhni biznesin'}</p>
          <p className="mt-2 text-sm text-muted">Kjo pamje nuk do të thotë se reklama është aktualisht e vlefshme për publikim.{status && ` Gjendja e ruajtur: ${statusLabels[status]}.`}</p>
        </section>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="button-primary" disabled={saving || uploading}>{saving ? 'Duke ruajtur…' : id ? 'Ruaj ndryshimet' : 'Krijo reklamën'}</button>
          <Link href="/admin/advertisements" navigate={navigate} className="button-secondary">Anulo</Link>
        </div>
      </form>
    </>}
  </AdminLayout>
}
