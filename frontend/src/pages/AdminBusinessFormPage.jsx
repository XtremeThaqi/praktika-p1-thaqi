import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from '../components/Link'
import BusinessLocationPicker from '../components/BusinessLocationPicker'
import { adminRequest } from '../lib/admin'
import { activeHours, applyWeekdayHours, blankHours, days, fieldForError, firstInvalidField, focusInvalidField, hasNewImage, isRequired, sectionForField } from '../lib/businessForm'
import AdminLayout from './AdminLayout'

const empty = { name: '', description: '', category_id: '', settlement_id: '', phone: '', address: '',
  latitude: '', longitude: '', location_verified: false, is_demo: false, email: '', website: '',
  social_links: { facebook: '', instagram: '', linkedin: '' }, services: [], status: 'draft' }
const headings = { basic: '01 — Informacioni bazë', location: '02 — Vendndodhja',
  schedule: '03 — Shërbimet dhe orari', media: '04 — Media dhe lidhje shtesë' }
const labels = { name: 'Emri', description: 'Përshkrimi', category_id: 'Kategoria',
  settlement_id: 'Vendbanimi', phone: 'Telefoni', address: 'Adresa', latitude: 'Gjerësia gjeografike',
  longitude: 'Gjatësia gjeografike', location_verified: 'Konfirmimi i vendndodhjes',
  services: 'Shërbimet', image: 'Imazhi', alt_text: 'Përshkrimi alternativ', email: 'Emaili', website: 'Website' }

export default function AdminBusinessFormPage({ id, navigate, onLogout, onSessionExpired }) {
  const [form, setForm] = useState(empty)
  const [hours, setHours] = useState(blankHours)
  const [images, setImages] = useState([])
  const [lookups, setLookups] = useState(null)
  const [loaded, setLoaded] = useState(!id)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState(id)
  const [intent, setIntent] = useState('draft')
  const [open, setOpen] = useState({ basic: true, location: true, schedule: false, media: false })
  const [manual, setManual] = useState(false)
  const [social, setSocial] = useState(false)
  const [focusRequest, setFocusRequest] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [file, setFile] = useState(null)
  const [fileKey, setFileKey] = useState(0)
  const [preview, setPreview] = useState('')
  const [imageKind, setImageKind] = useState('gallery')
  const [imageAlt, setImageAlt] = useState('')
  const [weekdayOpen, setWeekdayOpen] = useState('08:00')
  const [weekdayClose, setWeekdayClose] = useState('17:00')
  const [retry, setRetry] = useState(0)
  const focusSerial = useRef(0)
  const restoringHistory = useRef(false)

  useEffect(() => {
    let active = true
    setLoadError(''); setLoaded(!id)
    Promise.all([adminRequest('/api/categories'), adminRequest('/api/settlements'), adminRequest('/api/services'),
      id ? adminRequest(`/api/admin/businesses/${id}`) : Promise.resolve(null)])
      .then(([categories, settlements, services, business]) => {
        if (!active) return
        setLookups({ categories: categories.data, settlements: settlements.data, services: services.data })
        if (business) {
          const item = business.data
          setForm({ ...empty, ...item, category_id: item.category_id || '', settlement_id: item.settlement_id || '',
            latitude: item.latitude ?? '', longitude: item.longitude ?? '',
            social_links: { ...empty.social_links, ...(item.social_links || {}) },
            services: item.services.map((service) => service.id) })
          setHours(blankHours().map((row) => {
            const stored = item.hours.find((hour) => hour.day_of_week === row.day_of_week)
            return stored ? { ...stored, enabled: true, opens_at: stored.opens_at?.slice(0, 5) || '',
              closes_at: stored.closes_at?.slice(0, 5) || '' } : row
          }))
          setImages(item.images)
        }
        setDirty(false); setLoaded(true)
      }).catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) onSessionExpired()
        else setLoadError(problem.message)
      })
    return () => { active = false }
  }, [id, retry, onSessionExpired])

  useEffect(() => {
    if (!file) { setPreview(''); return undefined }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  useEffect(() => {
    const warn = (event) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    const warnBack = (event) => {
      if (restoringHistory.current) {
        restoringHistory.current = false
        event.stopImmediatePropagation()
      } else if (dirty && !window.confirm('Keni ndryshime të paruajtura. Të largoheni?')) {
        event.stopImmediatePropagation()
        restoringHistory.current = true
        window.history.forward()
      }
    }
    // Capture before the app's route listener updates the page on browser Back.
    window.addEventListener('popstate', warnBack, true)
    return () => window.removeEventListener('popstate', warnBack, true)
  }, [dirty])
  useLayoutEffect(() => {
    if (!focusRequest) return
    focusInvalidField(focusRequest.field)
    setFocusRequest(null)
  }, [focusRequest, open, manual, social, errors])

  function goTo(field) {
    setOpen((old) => ({ ...old, [sectionForField(field)]: true }))
    if (field === 'latitude' || field === 'longitude') setManual(true)
    if (field.startsWith('social_links-')) setSocial(true)
    setFocusRequest({ field, serial: ++focusSerial.current })
  }
  function report(problem, partial = '') {
    if (problem.status === 401 || problem.status === 403) { onSessionExpired(); return }
    const next = problem.status === 422 ? (problem.errors || {}) : {}
    setErrors(next)
    setMessage(partial ? `${partial} ${problem.message}` : problem.message)
    if (Object.keys(next).length) goTo(firstInvalidField(next, hours))
  }
  function change(field, value) {
    setDirty(true)
    setForm((old) => ({ ...old, [field]: value,
      ...(['address', 'latitude', 'longitude'].includes(field) && String(old[field] ?? '') !== String(value ?? '')
        ? { location_verified: false } : {}) }))
  }
  function changeHour(day, field, value) {
    setDirty(true)
    setHours((old) => old.map((hour) => hour.day_of_week === day ? { ...hour, [field]: value } : hour))
  }
  function error(key, field = key) {
    const messages = key === 'services' || key === 'hours'
      ? Object.entries(errors).filter(([name]) => name === key || (key === 'services' ? name.startsWith('services.') : /^hours\.\d+$/.test(name))).flatMap(([, list]) => list)
      : errors[key]
    return messages?.length > 0 && <p id={`error-${field}`} className="mt-1 text-sm font-medium text-red-900">{messages.join(' ')}</p>
  }
  function props(field, key = field) {
    return { id: `business-${field}`, 'aria-invalid': !!errors[key],
      'aria-describedby': errors[key] ? `error-${field}` : undefined,
      className: `field mt-2 scroll-mt-32 ${errors[key] ? 'border-red-700 bg-red-50/40' : ''}` }
  }
  const publishing = intent === 'publish' || form.status === 'published'
  function input(field, label, type = 'text', publishRequired = false) {
    const required = isRequired(field, intent, form.status, form.is_demo)
    return <label className="block min-w-0 text-sm font-semibold">{label} {required ? <span aria-hidden="true" className="text-red-900">*</span> : <span className="font-normal text-muted">{publishRequired ? '(për publikim)' : '(opsionale)'}</span>}
      <input {...props(field)} type={type} min={type === 'number' ? (field === 'latitude' ? -90 : -180) : undefined}
        max={type === 'number' ? (field === 'latitude' ? 90 : 180) : undefined} step={type === 'number' ? 'any' : undefined}
        aria-required={required} value={form[field] ?? ''} onChange={(event) => change(field, event.target.value)} />{error(field)}
    </label>
  }
  function select(field, label, options) {
    return <label className="text-sm font-semibold">{label} {isRequired(field, intent, form.status, form.is_demo) ? <span aria-hidden="true" className="text-red-900">*</span> : <span className="font-normal text-muted">(për publikim)</span>}
      <select {...props(field)} aria-required={isRequired(field, intent, form.status, form.is_demo)} value={form[field]} onChange={(event) => change(field, event.target.value)}>
        <option value="">Zgjidhni</option>{options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>{error(field)}
    </label>
  }
  function section(key, content) {
    return <section className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <h2><button type="button" className="flex min-h-11 w-full items-center justify-between gap-3 text-left font-display text-xl text-forest focus-visible:outline-2 focus-visible:outline-forest sm:text-2xl"
        aria-expanded={open[key]} aria-controls={`section-${key}`} onClick={() => setOpen((old) => ({ ...old, [key]: !old[key] }))}>
        {headings[key]} <span aria-hidden="true">{open[key] ? '−' : '+'}</span>
      </button></h2>
      {open[key] && <div id={`section-${key}`} className="mt-4">{content}</div>}
    </section>
  }

  async function save(event) {
    event.preventDefault()
    if (saving) return
    if (file && !imageAlt.trim()) {
      setErrors({ alt_text: ['Përshkrimi alternativ kërkohet kur zgjidhni një imazh.'] })
      setMessage('Plotësoni përshkrimin e imazhit para ruajtjes.'); goTo('alt_text'); return
    }
    setSaving(true); setErrors({}); setMessage('')
    const payload = { ...form, status: 'draft',
      category_id: form.category_id ? Number(form.category_id) : null,
      settlement_id: form.settlement_id ? Number(form.settlement_id) : null,
      latitude: form.latitude === '' ? null : form.latitude, longitude: form.longitude === '' ? null : form.longitude,
      website: form.website || null, email: form.email || null, description: form.description || null,
      address: form.address || null, phone: form.phone || null,
      social_links: Object.fromEntries(Object.entries(form.social_links).filter(([, value]) => value)),
      hours: activeHours(hours) }
    if (savedId) delete payload.status
    let detailsSaved = false
    let published = form.status === 'published'
    try {
      const response = await adminRequest(savedId ? `/api/admin/businesses/${savedId}` : '/api/admin/businesses', {
        method: savedId ? 'PUT' : 'POST', body: JSON.stringify(payload) })
      const businessId = response.data.id
      setSavedId(businessId); detailsSaved = true
      if (intent === 'publish' && !published) {
        try {
          await adminRequest(`/api/admin/businesses/${businessId}/publish`, { method: 'PATCH' })
          published = true; setForm((old) => ({ ...old, status: 'published' }))
        } catch (problem) { report(problem, 'Ndryshimet u ruajtën si draft; publikimi nuk u krye.'); return }
      }
      if (file) {
        const upload = new FormData()
        upload.append('image', file); upload.append('kind', imageKind); upload.append('alt_text', imageAlt.trim())
        const knownIds = new Set(images.map((image) => image.id))
        let uploaded
        try {
          uploaded = await adminRequest(`/api/admin/businesses/${businessId}/images`, { method: 'POST', body: upload })
        } catch (problem) {
          // A successful upload can still return an unreadable response. Check the
          // saved image list before allowing a retry that could create a duplicate.
          if (problem.status || problem.message !== 'Përgjigjja nuk mund të lexohet. Provoni përsëri.') throw problem
          try {
            const current = await adminRequest(`/api/admin/businesses/${businessId}`)
            if (!hasNewImage(current.data.images, knownIds, imageAlt.trim(), imageKind)) throw problem
            uploaded = current
          } catch { throw problem }
        }
        setImages(uploaded.data.images); setFile(null); setFileKey((value) => value + 1); setImageAlt('')
      }
      setDirty(false); navigate('/admin/businesses')
    } catch (problem) {
      if (detailsSaved && problem.status !== 422) {
        setErrors({ image: [problem.message] })
        setMessage(published ? 'Biznesi u publikua, por ngarkimi i imazhit nuk u konfirmua.' : 'Biznesi u ruajt si draft, por ngarkimi i imazhit nuk u konfirmua.')
        goTo('image')
      } else report(problem, detailsSaved ? (published ? 'Biznesi u publikua, por imazhi nuk u ngarkua.' : 'Biznesi u ruajt si draft, por imazhi nuk u ngarkua.') : '')
    } finally { setSaving(false) }
  }
  async function removeImage(image) {
    if (!window.confirm(`A dëshironi ta hiqni imazhin “${image.alt_text}”?`)) return
    try {
      const response = await adminRequest(`/api/admin/businesses/${savedId}/images/${image.id}`, { method: 'DELETE' })
      setImages(response.data.images); setMessage('Imazhi u hoq.')
    } catch (problem) { report(problem) }
  }
  async function archive() {
    if (!window.confirm(`A dëshironi ta arkivoni biznesin “${form.name}”?`)) return
    setSaving(true)
    try {
      const response = await adminRequest(`/api/admin/businesses/${savedId}/archive`, { method: 'PATCH' })
      setForm((old) => ({ ...old, status: response.data.status })); setMessage('Biznesi u arkivua.'); setDirty(false)
    } catch (problem) { report(problem) } finally { setSaving(false) }
  }
  function leave(href) {
    if (!dirty || window.confirm('Keni ndryshime të paruajtura. Të largoheni?')) navigate(href)
  }

  return <AdminLayout title={id ? 'Ndrysho biznesin' : 'Shto biznes'} current="businesses" navigate={leave} onLogout={onLogout}>
    <Link href="/admin/businesses" navigate={leave} className="mt-5 inline-block text-sm font-semibold underline">← Kthehu te lista</Link>
    {loadError && <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{loadError} <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button></div>}
    {!loaded && !loadError && <p role="status" className="mt-6">Duke ngarkuar formularin…</p>}
    {loaded && lookups && <>
      {message && <p role="alert" className="mt-5 rounded-xl border border-line bg-white p-4">{message}</p>}
      {Object.keys(errors).length > 0 && <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-950">
        <p className="font-semibold">Kontrolloni fushat e shënuara më poshtë.</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">{Object.entries(errors).map(([key, messages]) => {
          const field = fieldForError(key, hours)
          return <li key={key}><button type="button" className="text-left underline" onClick={() => goTo(field)}>
            {labels[field] || (field.startsWith('hours-') ? `${days[Number(field.split('-')[1])]} — orari` : field.replaceAll('-', ' '))}: {messages[0]}
          </button></li>
        })}</ul>
      </div>}
      {savedId && !id && <Link href={`/admin/businesses/${savedId}`} navigate={leave} className="mt-3 inline-block underline">Hap biznesin e ruajtur</Link>}
      <form onSubmit={save} noValidate className="mt-5 space-y-4 pb-20">
        {form.status === 'draft' && <fieldset className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <legend className="px-1 text-sm font-semibold text-forest">Synimi i ruajtjes</legend>
          <div className="flex flex-wrap gap-5 text-sm">
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="save-intent" checked={intent === 'draft'} onChange={() => setIntent('draft')} />{savedId ? 'Ruaj ndryshimet' : 'Ruaj si draft'}</label>
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="save-intent" checked={intent === 'publish'} onChange={() => setIntent('publish')} />Publiko biznesin</label>
          </div><p className="text-xs text-muted">Drafti kërkon vetëm emrin. Publikimi kërkon edhe përshkrimin, kategorinë, vendbanimin, telefonin, adresën dhe vendndodhjen e konfirmuar.</p>
        </fieldset>}
        {section('basic', <div className="grid gap-4 sm:grid-cols-2">
          {input('name', 'Emri i biznesit')}{select('category_id', 'Kategoria', lookups.categories)}
          {select('settlement_id', 'Vendbanimi', lookups.settlements)}{input('phone', 'Telefoni', 'tel', true)}
          <div className="sm:col-span-2">{input('address', 'Adresa', 'text', true)}</div>
          <label className="sm:col-span-2 text-sm font-semibold">Përshkrimi {publishing ? <span aria-hidden="true" className="text-red-900">*</span> : <span className="font-normal text-muted">(për publikim)</span>}
            <textarea {...props('description')} aria-required={publishing} className={`${props('description').className} min-h-28`} value={form.description || ''} onChange={(event) => change('description', event.target.value)} />{error('description')}
          </label>
        </div>)}
        {section('location', <>
          <BusinessLocationPicker latitude={form.latitude} longitude={form.longitude} onChange={(latitude, longitude) => {
            setDirty(true); setForm((old) => ({ ...old, latitude, longitude, location_verified: false })) }} />
          <p className="mt-3 text-sm text-muted">{form.latitude !== '' && form.longitude !== '' ? `Pini: ${form.latitude}, ${form.longitude}` : 'Nuk është zgjedhur ende një pin.'}</p>
          <button type="button" className="mt-4 min-h-11 font-semibold text-forest underline" aria-expanded={manual} aria-controls="manual-coordinates" onClick={() => setManual(!manual)}>Koordinatat manuale {manual ? '−' : '+'}</button>
          {manual && <div id="manual-coordinates" className="mt-3 grid gap-4 sm:grid-cols-2">{input('latitude', 'Gjerësia gjeografike', 'number', true)}{input('longitude', 'Gjatësia gjeografike', 'number', true)}</div>}
          <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input id="business-is_demo" type="checkbox" checked={!!form.is_demo} onChange={(event) => change('is_demo', event.target.checked)} />Të dhëna demonstrimi të simuluara</label>
          <label className="mt-2 flex min-h-11 items-center gap-3 text-sm font-semibold"><input id="business-location_verified" type="checkbox" checked={!!form.location_verified} aria-invalid={!!errors.location_verified} aria-describedby={errors.location_verified ? 'error-location_verified' : undefined} aria-required={publishing && !form.is_demo} onChange={(event) => change('location_verified', event.target.checked)} />Kam kontrolluar që pini përputhet me adresën {publishing && !form.is_demo && <span aria-hidden="true" className="text-red-900">*</span>}</label>{error('location_verified')}
        </>)}
        {section('schedule', <>
          <p className="text-sm text-muted">Ditët pa shënuar kanë orar të panjohur; “Mbyllur” do të thotë mbyllur shprehimisht. Orari mund të kalojë mesnatën.</p>
          <fieldset className="mt-4"><legend id="business-services" tabIndex="-1" aria-invalid={Object.keys(errors).some((key) => key === 'services' || key.startsWith('services.'))} aria-describedby={Object.keys(errors).some((key) => key === 'services' || key.startsWith('services.')) ? 'error-services' : undefined} className="font-semibold text-forest">Shërbimet · {form.services.length} të zgjedhura</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">{lookups.services.map((service) => <label key={service.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm hover:bg-paper"><input type="checkbox" checked={form.services.includes(service.id)} onChange={(event) => change('services', event.target.checked ? [...form.services, service.id] : form.services.filter((value) => value !== service.id))} />{service.name}</label>)}</div>{error('services')}
          </fieldset>
          <div className="mt-5 rounded-xl bg-paper p-3 sm:p-4"><p className="text-sm font-semibold">Apliko orarin për ditët e punës</p>
            <div className="mt-2 flex flex-wrap items-end gap-3"><label className="text-sm">Hapet<input type="time" className="field mt-1" value={weekdayOpen} onChange={(event) => setWeekdayOpen(event.target.value)} /></label>
              <label className="text-sm">Mbyllet<input type="time" className="field mt-1" value={weekdayClose} onChange={(event) => setWeekdayClose(event.target.value)} /></label>
              <button type="button" className="button-secondary" onClick={() => {
                if (!weekdayOpen || !weekdayClose || weekdayOpen === weekdayClose) { setMessage('Orari kërkon dy orë të ndryshme.'); return }
                if (hours.some((hour) => hour.day_of_week >= 1 && hour.day_of_week <= 5 && hour.enabled) && !window.confirm('Të zëvendësohet orari ekzistues për ditët e punës?')) return
                setHours((old) => applyWeekdayHours(old, weekdayOpen, weekdayClose)); setDirty(true); setMessage('Orari u aplikua për ditët e punës.')
              }}>Apliko orarin</button></div>
          </div>
          <div id="business-hours" tabIndex="-1" className="mt-4 space-y-2">{error('hours')}{hours.map((hour) => {
            const index = activeHours(hours).findIndex((item) => item.day_of_week === hour.day_of_week)
            const key = (part) => index >= 0 ? `hours.${index}.${part}` : null
            return <div key={hour.day_of_week} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-3 sm:grid-cols-[120px_110px_1fr_1fr] sm:items-center">
              <div><label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input id={`business-hours-${hour.day_of_week}-day_of_week`} type="checkbox" checked={hour.enabled} aria-invalid={!!(key('day_of_week') && errors[key('day_of_week')])} aria-describedby={key('day_of_week') && errors[key('day_of_week')] ? `error-hours-${hour.day_of_week}-day_of_week` : undefined} onChange={(event) => changeHour(hour.day_of_week, 'enabled', event.target.checked)} />{days[hour.day_of_week]}</label>{key('day_of_week') && error(key('day_of_week'), `hours-${hour.day_of_week}-day_of_week`)}</div>
              <div><label className="flex min-h-11 items-center gap-2 text-sm"><input id={`business-hours-${hour.day_of_week}-is_closed`} type="checkbox" disabled={!hour.enabled} checked={hour.is_closed} aria-invalid={!!(key('is_closed') && errors[key('is_closed')])} aria-describedby={key('is_closed') && errors[key('is_closed')] ? `error-hours-${hour.day_of_week}-is_closed` : undefined} onChange={(event) => changeHour(hour.day_of_week, 'is_closed', event.target.checked)} />Mbyllur</label>{key('is_closed') && error(key('is_closed'), `hours-${hour.day_of_week}-is_closed`)}</div>
              {['opens_at', 'closes_at'].map((part) => <label key={part} className="min-w-0 text-sm">{part === 'opens_at' ? 'Hapet' : 'Mbyllet'}<input id={`business-hours-${hour.day_of_week}-${part}`} type="time" className={`field mt-1 ${key(part) && errors[key(part)] ? 'border-red-700' : ''}`} disabled={!hour.enabled || hour.is_closed} aria-invalid={!!(key(part) && errors[key(part)])} aria-describedby={key(part) && errors[key(part)] ? `error-hours-${hour.day_of_week}-${part}` : undefined} value={hour[part] || ''} onChange={(event) => changeHour(hour.day_of_week, part, event.target.value)} />{key(part) && error(key(part), `hours-${hour.day_of_week}-${part}`)}</label>)}
            </div>
          })}</div>
        </>)}
        {section('media', <>
          {images.length > 0 && <ul className="space-y-3">{images.map((image) => <li key={image.id} className="flex items-center gap-3"><img src={image.path} alt={image.alt_text} className="size-16 rounded-lg object-cover" /><span className="min-w-0 flex-1 text-sm">{image.alt_text}</span><button type="button" onClick={() => removeImage(image)} className="min-h-11 text-sm font-semibold text-red-900 underline">Hiq</button></li>)}</ul>}
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Imazh i ri (opsional)<input key={fileKey} {...props('image')} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files[0] || null); setDirty(true) }} /><span className="mt-1 block text-xs font-normal text-muted">JPG, PNG ose WebP · maksimumi 5 MB.</span>{error('image')}</label>
            <label className="text-sm font-semibold">Lloji i imazhit<select {...props('kind')} value={imageKind} onChange={(event) => { setImageKind(event.target.value); setDirty(true) }}><option value="gallery">Fotografi</option><option value="logo">Logo</option></select>{error('kind')}</label>
            {file && <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-xl bg-paper p-3">{preview && <img src={preview} alt="Pamje paraprake e imazhit të zgjedhur" className="size-20 rounded-lg object-cover" />}<p className="min-w-0 flex-1 break-all text-sm">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p><button type="button" className="min-h-11 font-semibold underline" onClick={() => { setFile(null); setFileKey((value) => value + 1) }}>Hiq zgjedhjen</button></div>}
            <label className="sm:col-span-2 text-sm font-semibold">Përshkrimi alternativ {file ? <span aria-hidden="true" className="text-red-900">*</span> : <span className="font-normal text-muted">(kur ngarkohet imazh)</span>}<input {...props('alt_text')} aria-required={!!file} value={imageAlt} onChange={(event) => { setImageAlt(event.target.value); setDirty(true) }} />{error('alt_text')}</label>
            {input('website', 'Website', 'url')}{input('email', 'Emaili', 'email')}</div>
          <button type="button" className="mt-4 min-h-11 font-semibold text-forest underline" aria-expanded={social} aria-controls="social-links" onClick={() => setSocial(!social)}>Rrjetet sociale (opsionale) {social ? '−' : '+'}</button>
          {social && <div id="social-links" className="mt-3 grid gap-4 sm:grid-cols-2">{Object.keys(empty.social_links).map((network) => <label key={network} className="text-sm font-semibold">{network}<input {...props(`social_links-${network}`, `social_links.${network}`)} type="url" value={form.social_links[network] || ''} onChange={(event) => change('social_links', { ...form.social_links, [network]: event.target.value })} />{error(`social_links.${network}`, `social_links-${network}`)}</label>)}</div>}
        </>)}
        <div className="sticky bottom-0 z-20 -mx-2 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur sm:mx-0"><button type="submit" disabled={saving} className="button-primary">{saving ? 'Duke ruajtur…' : form.status === 'draft' && intent === 'publish' ? 'Publiko biznesin' : savedId ? 'Ruaj ndryshimet' : 'Ruaj si draft'}</button><Link href="/admin/businesses" navigate={leave} className="button-secondary">Anulo</Link>{savedId && form.status !== 'archived' && <button type="button" disabled={saving} onClick={archive} className="button-secondary">Arkivo</button>}{saving && <span role="status" className="text-sm">Duke ruajtur biznesin…</span>}</div>
      </form>
    </>}
  </AdminLayout>
}
