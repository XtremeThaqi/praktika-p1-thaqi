import { useEffect, useState } from 'react'
import { adminRequest } from '../lib/admin'
import AdminLayout from './AdminLayout'

const cards = [
  { key: 'published_businesses', label: 'Biznese të publikuara', note: 'Të dukshme në katalog' },
  { key: 'draft_businesses', label: 'Biznese draft', note: 'Në përgatitje' },
  { key: 'archived_businesses', label: 'Biznese të arkivuara', note: 'Të ruajtura, jo publike' },
  { key: 'active_advertisements', label: 'Reklama aktive', note: 'Brenda periudhës dhe me biznes të publikuar' },
]

export default function AdminDashboardPage({ user, navigate, onLogout, onSessionExpired }) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setStats(null)
    setError('')
    adminRequest('/api/admin/dashboard')
      .then((result) => { if (active) setStats(result.data) })
      .catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) onSessionExpired()
        else setError(problem.message)
      })
    return () => { active = false }
  }, [retry, onSessionExpired])

  return (
    <AdminLayout title="Paneli administrues" current="dashboard" navigate={navigate} onLogout={onLogout}>
      <p className="mt-4 text-sm text-muted">
        Mirë se erdhët, {user.name}. Këto shifra merren nga databaza.
      </p>
      {error && <div role="alert" className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
        <p>{error}</p>
        <button type="button" onClick={() => setRetry((count) => count + 1)} className="button-secondary mt-4">
          Provo përsëri
        </button>
      </div>}
      {!stats && !error && <p role="status" className="mt-8 text-muted">Duke ngarkuar statistikat…</p>}
      {stats && <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => <section key={card.key} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted">{card.label}</p>
          <p className="mt-4 font-display text-5xl text-forest">{stats[card.key]}</p>
          <p className="mt-3 text-xs leading-5 text-muted">{card.note}</p>
        </section>)}
      </div>}
    </AdminLayout>
  )
}
