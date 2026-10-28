import { useCallback, useEffect, useState } from 'react'
import SiteLayout from './components/SiteLayout'
import Link from './components/Link'
import ContactPage from './pages/ContactPage'
import DirectoryPage from './pages/DirectoryPage'
import BusinessPage from './pages/BusinessPage'
import HomePage from './pages/HomePage'
import AdminArea from './pages/AdminArea'
function currentLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  }
}
export default function App() {
  const [location, setLocation] = useState(currentLocation)
  const openBusiness = (slug) =>
    navigate(`/bizneset/${encodeURIComponent(slug)}`)
  useEffect(() => {
    const titles = {
      '/': 'Ballina',
      '/bizneset': 'Bizneset',
      '/kontakt': 'Kontakt',
      '/admin/login': 'Hyrja në administrim',
      '/admin/dashboard': 'Paneli administrues',
      '/admin/businesses': 'Menaxhimi i bizneseve',
      '/admin/businesses/new': 'Shto biznes',
      '/admin/categories': 'Menaxhimi i kategorive',
      '/admin/settlements': 'Menaxhimi i vendbanimeve',
      '/admin/services': 'Menaxhimi i shërbimeve',
      '/admin/advertisements': 'Menaxhimi i reklamave',
      '/admin/advertisements/new': 'Shto reklamë',
    }
    document.title = `${titles[location.pathname] || (location.pathname.startsWith('/admin/businesses/') ? 'Ndrysho biznesin' : location.pathname.startsWith('/admin/advertisements/') ? 'Ndrysho reklamën' : location.pathname.startsWith('/bizneset/') ? 'Profili i biznesit' : 'Faqja nuk u gjet')} · Bizneset e Lipjanit`
    document.getElementById('main')?.focus({
      preventScroll: true,
    })
  }, [location.pathname])
  useEffect(() => {
    const restore = () => setLocation(currentLocation())
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  const navigate = useCallback((href) => {
    window.history.pushState(null, '', href)
    setLocation(currentLocation())
    window.scrollTo(0, 0)
  }, [])

  if (
    location.pathname === '/admin/login' ||
    location.pathname === '/admin/dashboard' ||
    location.pathname === '/admin/businesses' ||
    location.pathname === '/admin/businesses/new' ||
    location.pathname === '/admin/advertisements' ||
    location.pathname === '/admin/advertisements/new' ||
    ['/admin/categories', '/admin/settlements', '/admin/services'].includes(location.pathname) ||
    /^\/admin\/businesses\/\d+$/.test(location.pathname) ||
    /^\/admin\/advertisements\/\d+$/.test(location.pathname)
  ) {
    return <AdminArea pathname={location.pathname} search={location.search} navigate={navigate} />
  }
  let page
  if (location.pathname === '/') {
    page = <HomePage navigate={navigate} onOpen={openBusiness} />
  } else if (location.pathname === '/bizneset') {
    page = (
      <DirectoryPage
        onOpen={openBusiness}
        search={location.search}
        navigate={navigate}
      />
    )
  } else if (/^\/bizneset\/[^/]+$/.test(location.pathname)) {
    page = (
      <BusinessPage
        key={location.pathname}
        slug={location.pathname.split('/')[2]}
        navigate={navigate}
      />
    )
  } else if (location.pathname === '/kontakt') {
    page = <ContactPage navigate={navigate} />
  } else {
    page = (
      <section className="container py-20">
        <p className="eyebrow">404</p>
        <h1 className="page-title mt-4">Faqja nuk u gjet.</h1>
        <Link href="/" navigate={navigate} className="button-primary mt-8">
          Kthehu në ballinë
        </Link>
      </section>
    )
  }
  return (
    <SiteLayout pathname={location.pathname} navigate={navigate}>
      {page}
    </SiteLayout>
  )
}
