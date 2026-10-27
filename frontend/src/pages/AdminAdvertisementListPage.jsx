import { useEffect, useState } from 'react'
import Link from '../components/Link'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'

export const placementLabels = {
  home_banner: 'Banner në ballinë',
  results_sidebar: 'Pranë rezultateve',
}
export const statusLabels = {
  active_now: 'Aktive tani',
  scheduled: 'E planifikuar',
  expired: 'E skaduar',
  disabled: 'E çaktivizuar',
  unpublished_business: 'Biznesi jo i publikuar',
}

export default function AdminAdvertisementListPage({ search, navigate, onLogout, onSessionExpired }) {
  const params = new URLSearchParams(search)
  const q = params.get('q') || ''
  const placement = params.get('placement') || ''
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)
  const [query, setQuery] = useState(q)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => { setQuery(q) }, [q])
  useEffect(() => {
    let active = true
    setResult(null)
    setError('')
    adminRequest('/api/admin/advertisements' + search)
      .then((data) => { if (active) setResult(data) })
      .catch((problem) => {
        if (!active) return
        if ([401, 403].includes(problem.status)) onSessionExpired()
        else setError(problem.message)
      })
    return () => { active = false }
  }, [search, retry, onSessionExpired])

  function changeFilters(nextQuery, nextPlacement, nextStatus, nextPage = 1) {
    const next = new URLSearchParams()
    if (nextQuery.trim()) next.set('q', nextQuery.trim())
    if (nextPlacement) next.set('placement', nextPlacement)
    if (nextStatus) next.set('status', nextStatus)
    if (nextPage > 1) next.set('page', String(nextPage))
    navigate('/admin/advertisements' + (next.size ? '?' + next : ''))
  }

  async function changeState(advertisement, action) {
    const deleting = action === 'delete'
    const message = deleting
      ? `A dëshironi ta fshini reklamën #${advertisement.id} të biznesit “${advertisement.business.name}”? Biznesi nuk fshihet.`
      : `A dëshironi ta ${advertisement.is_active ? 'çaktivizoni' : 'aktivizoni'} reklamën #${advertisement.id} të biznesit “${advertisement.business.name}”?`
    if (!window.confirm(message)) return
    setBusyId(advertisement.id)
    setError('')
    try {
      await adminRequest(`/api/admin/advertisements/${advertisement.id}${deleting ? '' : '/toggle'}`, {
        method: deleting ? 'DELETE' : 'PATCH',
        ...(!deleting && { body: JSON.stringify({ is_active: !advertisement.is_active }) }),
      })
      setRetry((value) => value + 1)
    } catch (problem) {
      if ([401, 403].includes(problem.status)) onSessionExpired()
      else setError(Object.values(problem.errors || {}).flat().join(' ') || problem.message)
    } finally {
      setBusyId(null)
    }
  }

  return <AdminLayout title="Menaxhimi i reklamave" current="advertisements" navigate={navigate} onLogout={onLogout}>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <p className="text-sm text-muted">Gjendja “Aktive tani” përfshin orarin dhe publikimin e biznesit.</p>
      <Link href="/admin/advertisements/new" navigate={navigate} className="button-primary">Shto reklamë</Link>
    </div>
    <form className="mt-7 grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_170px_170px_auto]"
      onSubmit={(event) => { event.preventDefault(); changeFilters(query, placement, status) }}>
      <label className="min-w-0 text-sm font-semibold">Kërko biznesin
        <input className="field mt-2" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className="min-w-0 text-sm font-semibold">Pozicioni
        <select className="field mt-2" value={placement} onChange={(event) => changeFilters(query, event.target.value, status)}>
          <option value="">Të gjitha</option>{Object.entries(placementLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      <label className="min-w-0 text-sm font-semibold">Gjendja
        <select className="field mt-2" value={status} onChange={(event) => changeFilters(query, placement, event.target.value)}>
          <option value="">Të gjitha</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      <button type="submit" className="button-secondary self-end">Kërko</button>
    </form>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
      {error} {!result && <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>}
    </div>}
    {!result && !error && <p role="status" className="mt-6">Duke ngarkuar reklamat…</p>}
    {result && <>
      <p className="mt-6 text-sm text-muted">{result.total} reklama gjithsej</p>
      {result.data.length === 0 ? <p className="mt-4 rounded-2xl border border-line bg-white p-6">Nuk u gjet asnjë reklamë.</p> :
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-[#eef2e9] text-forest"><tr>
              <th className="p-4">Reklama</th><th className="p-4">Pozicioni</th><th className="p-4">Fillimi / Mbarimi</th>
              <th className="p-4">Prioriteti</th><th className="p-4">Gjendja</th><th className="p-4">Veprimet</th>
            </tr></thead>
            <tbody>{result.data.map((ad) => <tr key={ad.id} className="border-t border-line align-top">
              <th scope="row" className="p-4 font-semibold"><div className="flex items-start gap-3">
                <img src={ad.image_path} alt="" className="h-12 w-16 rounded bg-paper object-contain" onError={(event) => { event.currentTarget.hidden = true }} />
                <span>#{ad.id} · {ad.business.name}<span className="block text-xs font-normal text-muted">{ad.business.status === 'published' ? 'Biznes i publikuar' : 'Biznes jo i publikuar'}</span></span>
              </div></th>
              <td className="p-4">{placementLabels[ad.placement]}</td>
              <td className="p-4">{ad.starts_at_local.replace('T', ' ')}<br />{ad.ends_at_local.replace('T', ' ')}<span className="block text-xs text-muted">Europe/Belgrade</span></td>
              <td className="p-4">{ad.priority}</td>
              <td className="p-4">{statusLabels[ad.status]}<span className="block text-xs text-muted">{ad.is_active ? 'E aktivizuar' : 'E çaktivizuar'}</span></td>
              <td className="p-4"><div className="flex flex-wrap gap-3">
                <Link href={`/admin/advertisements/${ad.id}`} navigate={navigate} className="font-semibold text-forest underline">Ndrysho</Link>
                <button type="button" disabled={busyId !== null} className="font-semibold text-forest underline" onClick={() => changeState(ad, 'toggle')}>{ad.is_active ? 'Çaktivizo' : 'Aktivizo'}</button>
                <button type="button" disabled={busyId !== null} className="font-semibold text-red-900 underline" onClick={() => changeState(ad, 'delete')}>Fshi</button>
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="button-secondary" disabled={page <= 1} onClick={() => changeFilters(q, placement, status, page - 1)}>Faqja e mëparshme</button>
        <span className="text-sm">Faqja {result.current_page} nga {result.last_page}</span>
        <button type="button" className="button-secondary" disabled={page >= result.last_page} onClick={() => changeFilters(q, placement, status, page + 1)}>Faqja tjetër</button>
      </div>
    </>}
  </AdminLayout>
}
