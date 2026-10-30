import { useState } from 'react'
import Link from '../components/Link'

const sections = [
  ['dashboard', 'Përmbledhje'],
  ['businesses', 'Bizneset'],
  ['categories', 'Kategoritë'],
  ['settlements', 'Vendbanimet'],
  ['services', 'Shërbimet'],
  ['advertisements', 'Reklamat'],
]

export default function AdminLayout({ title, current, navigate, onLogout, confirmLogout, children }) {
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState('')

  async function signOut() {
    if (signingOut) return
    if (confirmLogout && !confirmLogout()) return
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
      <a className="skip-link" href="#main">Kalo te përmbajtja</a>
      <header className="border-b border-line bg-white">
        <div className="container flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-display text-xl font-semibold text-forest">Bizneset e Lipjanit</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">Paneli administrues</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" navigate={navigate} className="button-secondary">Faqja publike</Link>
            <button type="button" onClick={signOut} disabled={signingOut} className="button-primary">
              {signingOut ? 'Duke dalë…' : 'Dil nga paneli'}
            </button>
          </div>
        </div>
      </header>
      <div className="container grid gap-8 py-8 md:grid-cols-[210px_minmax(0,1fr)] md:py-12">
        <nav aria-label="Navigimi i administrimit" className="h-fit rounded-2xl border border-line bg-white p-3">
          {sections.map(([section, label]) => <Link key={section} href={`/admin/${section}`} navigate={navigate}
            aria-current={current === section ? 'page' : undefined}
            className={current === section
              ? 'block rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white'
              : 'block rounded-xl px-4 py-3 text-sm font-semibold text-forest hover:bg-[#eef2e9]'}>
            {label}
          </Link>)}
        </nav>
        <main id="main" tabIndex="-1" className="min-w-0">
          {error && <p role="alert" className="mb-5 text-red-900">{error}</p>}
          <p className="eyebrow">Administrim</p>
          <h1 className="mt-3 page-title">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  )
}
