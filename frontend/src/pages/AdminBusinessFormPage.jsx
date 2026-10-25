import { useEffect, useState } from 'react'
import Link from '../components/Link'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'

const days = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë']
const blank = {
  name: '', description: '', category_id: '', settlement_id: '', address: '', phone: '',
  email: '', website: '', latitude: '', longitude: '', location_verified: false,
  is_demo: false, social_links: { facebook: '', instagram: '', linkedin: '' },
  services: [], status: 'draft',
}
const blankHours = () => days.map((_, day_of_week) => ({
  day_of_week, enabled: false, is_closed: false, opens_at: '08:00', closes_at: '17:00',
}))

export default function AdminBusinessFormPage({ id, navigate, onLogout, onSessionExpired }) {
  const [form, setForm] = useState(blank)
  const [hours, setHours] = useState(blankHours)
  const [images, setImages] = useState([])
  const [lookups, setLookups] = useState(null)
  const [loaded, setLoaded] = useState(!id)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState(id)
  const [file, setFile] = useState(null)
  const [imageKind, setImageKind] = useState('gallery')
  const [imageAlt, setImageAlt] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoadError('')
    setLoaded(!id)
    Promise.all([
      adminRequest('/api/categories'),
      adminRequest('/api/settlements'),
      adminRequest('/api/services'),
      id ? adminRequest(`/api/admin/businesses/${id}`) : Promise.resolve(null),
    ]).then(([categories, settlements, services, business]) => {
      if (!active) return
      setLookups({ categories: categories.data, settlements: settlements.data, services: services.data })
      if (business) {
        const item = business.data
        setForm({
          ...blank, ...item,
          category_id: item.category_id || '', settlement_id: item.settlement_id || '',
          latitude: item.latitude ?? '', longitude: item.longitude ?? '',
          social_links: { ...blank.social_links, ...(item.social_links || {}) },
          services: item.services.map((service) => service.id),
        })
        setHours(blankHours().map((row) => {
          const stored = item.hours.find((hour) => hour.day_of_week === row.day_of_week)
          return stored ? { ...stored, enabled: true, opens_at: stored.opens_at?.slice(0, 5) || '',
            closes_at: stored.closes_at?.slice(0, 5) || '' } : row
        }))
        setImages(item.images)
      }
      setLoaded(true)
    }).catch((problem) => {
      if (!active) return
      if (problem.status === 401 || problem.status === 403) onSessionExpired()
      else setLoadError(problem.message)
    })
    return () => { active = false }
  }, [id, retry, onSessionExpired])

  function change(field, value) {
    setForm((previous) => ({
      ...previous, [field]: value,
      ...(['address', 'latitude', 'longitude'].includes(field) ? { location_verified: false } : {}),
    }))
  }
  function changeHour(day, field, value) {
    setHours((previous) => previous.map((hour) =>
      hour.day_of_week === day ? { ...hour, [field]: value } : hour))
  }
  function fieldError(field) {
    return errors[field] && <p className="mt-1 text-sm text-red-900">{errors[field][0]}</p>
  }
  function input(field, label, type = 'text', required = false) {
    return <label className="block text-sm font-semibold">{label} {required ? '*' : '(opsionale)'}
      <input type={type} step={type === 'number' ? 'any' : undefined} className="field mt-2" value={form[field] ?? ''}
        onChange={(event) => change(field, event.target.value)} aria-invalid={!!errors[field]} />
      {fieldError(field)}
    </label>
  }

  async function save(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setErrors({})
    setMessage('')
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      settlement_id: form.settlement_id ? Number(form.settlement_id) : null,
      latitude: form.latitude === '' ? null : form.latitude,
      longitude: form.longitude === '' ? null : form.longitude,
      website: form.website || null,
      email: form.email || null,
      description: form.description || null,
      address: form.address || null,
      phone: form.phone || null,
      social_links: Object.fromEntries(Object.entries(form.social_links).filter(([, value]) => value)),
      hours: hours.filter((hour) => hour.enabled).map(({ day_of_week, is_closed, opens_at, closes_at }) => ({
        day_of_week, is_closed, opens_at: is_closed ? null : opens_at, closes_at: is_closed ? null : closes_at,
      })),
    }
    if (savedId) delete payload.status
    let businessSaved = false
    try {
      const response = await adminRequest(savedId
        ? `/api/admin/businesses/${savedId}` : '/api/admin/businesses', {
        method: savedId ? 'PUT' : 'POST', body: JSON.stringify(payload),
      })
      const businessId = response.data.id
      setSavedId(businessId)
      businessSaved = true
      if (file) {
        const upload = new FormData()
        upload.append('image', file)
        upload.append('kind', imageKind)
        upload.append('alt_text', imageAlt)
        const uploaded = await adminRequest(`/api/admin/businesses/${businessId}/images`, {
          method: 'POST', body: upload,
        })
        setImages(uploaded.data.images)
        setFile(null)
        setImageAlt('')
      }
      navigate('/admin/businesses')
    } catch (problem) {
      if (problem.status === 401 || problem.status === 403) onSessionExpired()
      else {
        setErrors(problem.errors || {})
        setMessage(businessSaved ? 'Biznesi u ruajt, por imazhi nuk u ngarkua. ' + problem.message : problem.message)
      }
    } finally {
      setSaving(false)
    }
  }

  async function removeImage(image) {
    if (!window.confirm(`A dëshironi ta hiqni imazhin “${image.alt_text}”?`)) return
    setMessage('')
    try {
      const response = await adminRequest(`/api/admin/businesses/${savedId}/images/${image.id}`, { method: 'DELETE' })
      setImages(response.data.images)
    } catch (problem) {
      if (problem.status === 401 || problem.status === 403) onSessionExpired()
      else setMessage(problem.message)
    }
  }

  async function changeStatus(action) {
    const verb = action === 'publish' ? 'publikoni' : 'arkivoni'
    if (!window.confirm(`A dëshironi ta ${verb} biznesin “${form.name}”?`)) return
    setMessage('')
    setErrors({})
    try {
      const response = await adminRequest(`/api/admin/businesses/${savedId}/${action}`, { method: 'PATCH' })
      setForm((previous) => ({ ...previous, status: response.data.status }))
      setMessage(action === 'publish' ? 'Biznesi u publikua.' : 'Biznesi u arkivua.')
    } catch (problem) {
      if (problem.status === 401 || problem.status === 403) onSessionExpired()
      else { setErrors(problem.errors || {}); setMessage(problem.message) }
    }
  }

  return <AdminLayout title={id ? 'Ndrysho biznesin' : 'Shto biznes'} current="businesses" navigate={navigate} onLogout={onLogout}>
    <Link href="/admin/businesses" navigate={navigate} className="mt-5 inline-block text-sm font-semibold underline">← Kthehu te lista</Link>
    {loadError && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
      {loadError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>
    </div>}
    {!loaded && !loadError && <p role="status" className="mt-6">Duke ngarkuar formularin…</p>}
    {loaded && lookups && <>
      {message && <p role="alert" className="mt-6 rounded-xl border border-line bg-white p-4">{message}</p>}
      {savedId && !id && <Link href={`/admin/businesses/${savedId}`} navigate={navigate} className="mt-3 inline-block underline">Hap biznesin e ruajtur</Link>}
      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-2xl text-forest">Informacioni bazë</h2>
          <p className="mt-2 text-sm text-muted">* Emri duhet për ruajtje. Fushat e tjera plotësohen para publikimit.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {input('name', 'Emri i biznesit', 'text', true)}
            <label className="text-sm font-semibold">Kategoria (për publikim)
              <select className="field mt-2" value={form.category_id} onChange={(event) => change('category_id', event.target.value)} aria-invalid={!!errors.category_id}>
                <option value="">Zgjidh kategorinë</option>
                {lookups.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>{fieldError('category_id')}
            </label>
            <label className="text-sm font-semibold">Vendbanimi (për publikim)
              <select className="field mt-2" value={form.settlement_id} onChange={(event) => change('settlement_id', event.target.value)} aria-invalid={!!errors.settlement_id}>
                <option value="">Zgjidh vendbanimin</option>
                {lookups.settlements.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>{fieldError('settlement_id')}
            </label>
            {input('phone', 'Telefoni')}
            {input('address', 'Adresa')}
            {input('email', 'Emaili', 'email')}
            {input('website', 'Website', 'url')}
            <label className="sm:col-span-2 text-sm font-semibold">Përshkrimi (për publikim)
              <textarea className="field mt-2 min-h-32" value={form.description || ''} onChange={(event) => change('description', event.target.value)} aria-invalid={!!errors.description} />
              {fieldError('description')}
            </label>
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-2xl text-forest">Vendndodhja dhe lidhjet</h2>
          <p className="mt-2 text-sm text-muted">Kontrolloni koordinatat kundrejt adresës para publikimit. Të dhënat demo mbeten të shënuara si të simuluara.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {input('latitude', 'Gjerësia gjeografike', 'number')}
            {input('longitude', 'Gjatësia gjeografike', 'number')}
            {Object.keys(blank.social_links).map((network) => <label key={network} className="text-sm font-semibold">{network} (opsionale)
              <input type="url" className="field mt-2" value={form.social_links[network] || ''}
                onChange={(event) => change('social_links', { ...form.social_links, [network]: event.target.value })} />
              {fieldError(`social_links.${network}`)}
            </label>)}
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={!!form.is_demo} onChange={(event) => change('is_demo', event.target.checked)} />
            Këto janë të dhëna demonstrimi të simuluara.</label>
          <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={!!form.location_verified} onChange={(event) => change('location_verified', event.target.checked)} />
            Kam kontrolluar që koordinatat përputhen me adresën.</label>
          {fieldError('location_verified')}{fieldError('latitude')}{fieldError('longitude')}
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-2xl text-forest">Shërbimet</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {lookups.services.map((service) => <label key={service.id} className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={form.services.includes(service.id)}
                onChange={(event) => change('services', event.target.checked
                  ? [...form.services, service.id] : form.services.filter((value) => value !== service.id))} />
              {service.name}
            </label>)}
          </div>{fieldError('services')}
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-2xl text-forest">Orari i punës</h2>
          <p className="mt-2 text-sm text-muted">Lini ditën pa shënuar kur orari nuk dihet.</p>
          <div className="mt-5 space-y-4">
            {hours.map((hour) => <div key={hour.day_of_week} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-[130px_1fr_1fr_1fr] sm:items-center">
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={hour.enabled}
                onChange={(event) => changeHour(hour.day_of_week, 'enabled', event.target.checked)} />{days[hour.day_of_week]}</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!hour.enabled} checked={hour.is_closed}
                onChange={(event) => changeHour(hour.day_of_week, 'is_closed', event.target.checked)} />Mbyllur</label>
              <label className="text-sm">Hapet<input type="time" className="field mt-1" disabled={!hour.enabled || hour.is_closed}
                value={hour.opens_at || ''} onChange={(event) => changeHour(hour.day_of_week, 'opens_at', event.target.value)} /></label>
              <label className="text-sm">Mbyllet<input type="time" className="field mt-1" disabled={!hour.enabled || hour.is_closed}
                value={hour.closes_at || ''} onChange={(event) => changeHour(hour.day_of_week, 'closes_at', event.target.value)} /></label>
              {hour.enabled && fieldError(`hours.${hours.filter((item) => item.enabled && item.day_of_week < hour.day_of_week).length}.closes_at`)}
            </div>)}
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
          <h2 className="font-display text-2xl text-forest">Imazhet</h2>
          {images.length > 0 && <ul className="mt-4 space-y-3">{images.map((image) => <li key={image.id} className="flex flex-wrap items-center gap-3">
            <img src={image.path} alt={image.alt_text} className="size-16 rounded-lg object-cover" />
            <span className="min-w-0 flex-1 text-sm">{image.alt_text}</span>
            <button type="button" onClick={() => removeImage(image)} className="text-sm font-semibold text-red-900 underline">Hiq</button>
          </li>)}</ul>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold">Imazh i ri (opsional, JPG/PNG/WebP deri 5 MB)
              <input type="file" accept="image/jpeg,image/png,image/webp" className="field mt-2" onChange={(event) => setFile(event.target.files[0] || null)} />
              {fieldError('image')}
            </label>
            <label className="text-sm font-semibold">Lloji
              <select className="field mt-2" value={imageKind} onChange={(event) => setImageKind(event.target.value)}>
                <option value="gallery">Fotografi</option><option value="logo">Logo</option>
              </select>
            </label>
            <label className="text-sm font-semibold sm:col-span-2">Përshkrimi alternativ i imazhit
              <input className="field mt-2" value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} />
              {fieldError('alt_text')}
            </label>
          </div>
        </section>
        {!savedId && <label className="block max-w-xs text-sm font-semibold">Ruaje si
          <select className="field mt-2" value={form.status} onChange={(event) => change('status', event.target.value)}>
            <option value="draft">Në përgatitje</option><option value="published">I publikuar</option>
          </select>{fieldError('status')}
        </label>}
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="button-primary">{saving ? 'Duke ruajtur…' : 'Ruaj biznesin'}</button>
          <Link href="/admin/businesses" navigate={navigate} className="button-secondary">Anulo</Link>
          {savedId && form.status === 'draft' && <button type="button" onClick={() => changeStatus('publish')} className="button-secondary">Publiko</button>}
          {savedId && form.status !== 'archived' && <button type="button" onClick={() => changeStatus('archive')} className="button-secondary">Arkivo</button>}
        </div>
      </form>
    </>}
  </AdminLayout>
}
