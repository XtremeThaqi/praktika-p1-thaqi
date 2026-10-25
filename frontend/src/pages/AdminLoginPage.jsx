import { useState } from 'react'
import Link from '../components/Link'
import { loginAdmin } from '../lib/admin'

export default function AdminLoginPage({ navigate, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')
    try {
      const result = await loginAdmin(email.trim(), password)
      setPassword('')
      onLogin(result.user)
      navigate('/admin/dashboard')
    } catch (problem) {
      setError(problem.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      id="main"
      tabIndex="-1"
      className="container min-h-screen py-8 sm:py-14"
    >
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          navigate={navigate}
          className="text-sm font-semibold text-forest underline underline-offset-4"
        >
          ← Kthehu te faqja publike
        </Link>
        <div className="mt-10 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-9">
          <p className="eyebrow">Administrimi</p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            Hyr në panel
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Përdorni llogarinë e autorizuar për të parë gjendjen e katalogut.
          </p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold"
              >
                Emaili
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                className="field"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold"
              >
                Fjalëkalimi
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="button-primary w-full"
            >
              {busy ? 'Duke hyrë…' : 'Hyr në panel'}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Projekt studentor i praktikës profesionale · Nuk është regjistër
          zyrtar.
        </p>
      </div>
    </main>
  )
}
