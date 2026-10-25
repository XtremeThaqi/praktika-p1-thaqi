import { useEffect, useState } from 'react'
import Link from '../components/Link'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'

const statusLabels = {
  draft: 'Në përgatitje',
  published: 'I publikuar',
  archived: 'I arkivuar',
}
const badgeStyles = {
  draft: 'bg-amber-100 text-amber-950',
  published: 'bg-emerald-100 text-emerald-950',
  archived: 'bg-stone-200 text-stone-800',
}

export default function AdminBusinessListPage({ search, navigate, onLogout, onSessionExpired }) {
  const params = new URLSearchParams(search)
  const q = params.get('q') || ''
  const status = params.get('status') || ''
  const page = Number(params.get('page') || 1)
  const [query, setQuery] = useState(q)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    setQuery(q)
  }, [q])

  useEffect(() => {
    let active = true
    setResult(null)
    setError('')
    adminRequest('/api/admin/businesses' + (search || ''))
      .then((data) => { if (active) setResult(data) })
      .catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) onSessionExpired()
        else setError(problem.message)
      })
    return () => { active = false }
  }, [search, retry, onSessionExpired])

  function changeFilters(nextQuery, nextStatus, nextPage = 1) {
    const next = new URLSearchParams()
    if (nextQuery.trim()) next.set('q', nextQuery.trim())
    if (nextStatus) next.set('status', nextStatus)
    if (nextPage > 1) next.set('page', String(nextPage))
    navigate('/admin/businesses' + (next.size ? '?' + next : ''))
  }

  async function changeStatus(business, action) {
    const verb = action === 'publish' ? 'publikoni' : 'arkivoni'
    if (!window.confirm(`A dëshironi ta ${verb} biznesin “${business.name}”?`)) return
    setBusyId(business.id)
    setError('')
    try {
      await adminRequest(`/api/admin/businesses/${business.id}/${action}`, { method: 'PATCH' })
      setRetry((value) => value + 1)
    } catch (problem) {
      if (problem.status === 401 || problem.status === 403) onSessionExpired()
      else setError(Object.values(problem.errors || {}).flat().join(' ') || problem.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout title="Menaxhimi i bizneseve" current="businesses" navigate={navigate} onLogout={onLogout}>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">Kërkoni, përditësoni dhe kontrolloni publikimin e bizneseve.</p>
        <Link href="/admin/businesses/new" navigate={navigate} className="button-primary">Shto biznes</Link>
      </div>
      <form className="mt-8 grid gap-3 rounded-2xl border border-line bg-white p-5 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
        onSubmit={(event) => { event.preventDefault(); changeFilters(query, status) }}>
        <label className="text-sm font-semibold">Kërko sipas emrit
          <input className="field mt-2" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">Statusi
          <select className="field mt-2" value={status} onChange={(event) => changeFilters(query, event.target.value)}>
            <option value="">Të gjitha</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button className="button-secondary self-end" type="submit">Kërko</button>
      </form>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
        {error} {!result && <button type="button" className="underline" onClick={() => setRetry((value) => value + 1)}>Provo përsëri</button>}
      </div>}
      {!result && !error && <p role="status" className="mt-6">Duke ngarkuar bizneset…</p>}
      {result && <>
        <p className="mt-6 text-sm text-muted">{result.total} biznese gjithsej</p>
        {result.data.length === 0 ? <p className="mt-5 rounded-2xl border border-line bg-white p-6">Nuk u gjet asnjë biznes.</p> :
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[#eef2e9] text-forest"><tr>
                <th className="p-4">Biznesi</th><th className="p-4">Kategoria</th>
                <th className="p-4">Vendbanimi</th><th className="p-4">Statusi</th><th className="p-4">Veprimet</th>
              </tr></thead>
              <tbody>{result.data.map((business) => <tr key={business.id} className="border-t border-line">
                <th scope="row" className="p-4 font-semibold">{business.name}{business.is_demo && <span className="block text-xs font-normal text-muted">Demo</span>}</th>
                <td className="p-4">{business.category?.name || '—'}</td>
                <td className="p-4">{business.settlement?.name || '—'}</td>
                <td className="p-4"><span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${badgeStyles[business.status]}`}>{statusLabels[business.status]}</span></td>
                <td className="p-4"><div className="flex flex-wrap gap-3">
                  <Link href={`/admin/businesses/${business.id}`} navigate={navigate} className="font-semibold underline">Shiko / ndrysho</Link>
                  {business.status === 'published' && <Link href={`/bizneset/${business.slug}`} navigate={navigate} className="underline">Profili publik</Link>}
                  {business.status === 'draft' && <button type="button" disabled={busyId !== null} onClick={() => changeStatus(business, 'publish')} className="font-semibold text-forest underline">Publiko</button>}
                  {business.status !== 'archived' && <button type="button" disabled={busyId !== null} onClick={() => changeStatus(business, 'archive')} className="font-semibold text-red-900 underline">Arkivo</button>}
                </div></td>
              </tr>)}</tbody>
            </table>
          </div>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="button-secondary" disabled={page <= 1} onClick={() => changeFilters(q, status, page - 1)}>Faqja e mëparshme</button>
          <span className="text-sm">Faqja {result.current_page} nga {result.last_page}</span>
          <button type="button" className="button-secondary" disabled={page >= result.last_page} onClick={() => changeFilters(q, status, page + 1)}>Faqja tjetër</button>
        </div>
      </>}
    </AdminLayout>
  )
}
