import { useCallback, useEffect, useState } from 'react'
import AdminDashboardPage from './AdminDashboardPage'
import AdminLoginPage from './AdminLoginPage'
import { adminRequest, logoutAdmin } from '../lib/admin'

export default function AdminArea({ pathname, navigate }) {
  const [user, setUser] = useState(undefined)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setUser(undefined)
    setError('')
    adminRequest('/api/admin/me')
      .then((result) => {
        if (active) setUser(result.user)
      })
      .catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) setUser(null)
        else setError(problem.message)
      })
    return () => {
      active = false
    }
  }, [pathname, retry])

  useEffect(() => {
    if (error || user === undefined) return
    if (pathname === '/admin/login' && user) navigate('/admin/dashboard')
    if (pathname === '/admin/dashboard' && !user) navigate('/admin/login')
  }, [pathname, user, error, navigate])

  const sessionExpired = useCallback(() => {
    setUser(null)
    navigate('/admin/login')
  }, [navigate])

  async function signOut() {
    await logoutAdmin()
    setUser(null)
    navigate('/admin/login')
  }

  if (error) {
    return (
      <main id="main" tabIndex="-1" className="container py-20">
        <p role="alert" className="text-red-900">
          {error}
        </p>
        <button
          type="button"
          className="button-secondary mt-5"
          onClick={() => setRetry((count) => count + 1)}
        >
          Provo përsëri
        </button>
      </main>
    )
  }

  if (
    user === undefined ||
    (pathname === '/admin/login' && user) ||
    (pathname === '/admin/dashboard' && !user)
  ) {
    return (
      <main id="main" tabIndex="-1" className="container py-20" role="status">
        Duke kontrolluar sesionin…
      </main>
    )
  }

  return pathname === '/admin/login' ? (
    <AdminLoginPage navigate={navigate} onLogin={setUser} />
  ) : (
    <AdminDashboardPage
      user={user}
      navigate={navigate}
      onLogout={signOut}
      onSessionExpired={sessionExpired}
    />
  )
}
