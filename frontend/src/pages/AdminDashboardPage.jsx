import { useEffect, useState } from 'react'
import Link from '../components/Link'
import { adminRequest } from '../lib/admin'

const cards = [
  {
    key: 'published_businesses',
    label: 'Biznese të publikuara',
    note: 'Të dukshme në katalog',
  },
  { key: 'draft_businesses', label: 'Biznese draft', note: 'Në përgatitje' },
  {
    key: 'archived_businesses',
    label: 'Biznese të arkivuara',
    note: 'Të ruajtura, jo publike',
  },
  {
    key: 'active_advertisements',
    label: 'Reklama aktive',
    note: 'Brenda periudhës dhe me biznes të publikuar',
  },
]

export default function AdminDashboardPage({
  user,
  navigate,
  onLogout,
  onSessionExpired,
}) {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let active = true
    setStats(null)
    setError('')

    adminRequest('/api/admin/dashboard')
      .then((result) => {
        if (active) setStats(result.data)
      })
      .catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) onSessionExpired()
        else setError(problem.message)
      })

    return () => {
      active = false
    }
  }, [retry, onSessionExpired])

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    setError('')
    try {
      await onLogout()
    } catch (problem) {
      setError(problem.message)
      setSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <a className="skip-link" href="#main">
        Kalo te përmbajtja
      </a>
      <header className="border-b border-line bg-white">
        <div className="container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-display text-xl font-semibold text-forest">
              Bizneset e Lipjanit
            </p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Paneli administrues
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" navigate={navigate} className="button-secondary">
              Faqja publike
            </Link>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="button-primary"
            >
              {signingOut ? 'Duke dalë…' : 'Dil nga paneli'}
            </button>
          </div>
        </div>
      </header>

      <div className="container grid gap-8 py-8 md:grid-cols-[210px_minmax(0,1fr)] md:py-12">
        <nav
          aria-label="Navigimi i administrimit"
          className="h-fit rounded-2xl border border-line bg-white p-3"
        >
          <Link
            href="/admin/dashboard"
            navigate={navigate}
            aria-current="page"
            className="block rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white"
          >
            Përmbledhje
          </Link>
          <Link
            href="/admin/businesses"
            navigate={navigate}
            className="mt-1 block rounded-xl px-4 py-3 text-sm font-semibold text-forest hover:bg-[#eef2e9]"
          >
            Bizneset
          </Link>
        </nav>

        <main id="main" tabIndex="-1" className="min-w-0">
          <p className="eyebrow">Përmbledhje</p>
          <h1 className="mt-3 page-title">Paneli administrues</h1>
          <p className="mt-4 text-sm text-muted">
            Mirë se erdhët, {user.name}. Këto shifra merren nga databaza.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setRetry((count) => count + 1)}
                className="button-secondary mt-4"
              >
                Provo përsëri
              </button>
            </div>
          )}
          {!stats && !error && (
            <p role="status" className="mt-8 text-muted">
              Duke ngarkuar statistikat…
            </p>
          )}
          {stats && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <section
                  key={card.key}
                  className="rounded-2xl border border-line bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-semibold text-muted">
                    {card.label}
                  </p>
                  <p className="mt-4 font-display text-5xl text-forest">
                    {stats[card.key]}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {card.note}
                  </p>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
