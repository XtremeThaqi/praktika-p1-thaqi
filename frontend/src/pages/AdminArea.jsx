import { useCallback, useEffect, useState } from 'react'
import AdminDashboardPage from './AdminDashboardPage'
import AdminBusinessListPage from './AdminBusinessListPage'
import AdminBusinessFormPage from './AdminBusinessFormPage'
import AdminLoginPage from './AdminLoginPage'
import AdminTaxonomyPage from './AdminTaxonomyPage'
import AdminAdvertisementListPage from './AdminAdvertisementListPage'
import AdminAdvertisementFormPage from './AdminAdvertisementFormPage'
import { adminRequest, logoutAdmin } from '../lib/admin'

export default function AdminArea({ pathname, search, navigate }) {
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
    if (pathname !== '/admin/login' && !user) navigate('/admin/login')
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
    (pathname !== '/admin/login' && !user)
  ) {
    return (
      <main id="main" tabIndex="-1" className="container py-20" role="status">
        Duke kontrolluar sesionin…
      </main>
    )
  }

  if (pathname === '/admin/login') {
    return <AdminLoginPage navigate={navigate} onLogin={setUser} />
  }
  if (pathname === '/admin/businesses') {
    return <AdminBusinessListPage search={search} navigate={navigate}
      onLogout={signOut} onSessionExpired={sessionExpired} />
  }
  if (pathname === '/admin/businesses/new' || /^\/admin\/businesses\/\d+$/.test(pathname)) {
    return <AdminBusinessFormPage id={pathname === '/admin/businesses/new' ? null : pathname.split('/')[3]}
      navigate={navigate} onLogout={signOut} onSessionExpired={sessionExpired} />
  }
  if (['/admin/categories', '/admin/settlements', '/admin/services'].includes(pathname)) {
    return <AdminTaxonomyPage key={pathname} kind={pathname.split('/')[2]}
      navigate={navigate} onLogout={signOut} onSessionExpired={sessionExpired} />
  }
  if (pathname === '/admin/advertisements') {
    return <AdminAdvertisementListPage search={search} navigate={navigate}
      onLogout={signOut} onSessionExpired={sessionExpired} />
  }
  if (pathname === '/admin/advertisements/new' || /^\/admin\/advertisements\/\d+$/.test(pathname)) {
    return <AdminAdvertisementFormPage key={pathname}
      id={pathname === '/admin/advertisements/new' ? null : pathname.split('/')[3]}
      navigate={navigate} onLogout={signOut} onSessionExpired={sessionExpired} />
  }
  return (
    <AdminDashboardPage
      user={user}
      navigate={navigate}
      onLogout={signOut}
      onSessionExpired={sessionExpired}
    />
  )
}
