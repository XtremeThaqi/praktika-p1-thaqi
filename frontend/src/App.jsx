import { useEffect, useState } from 'react'
import SiteLayout from './components/SiteLayout'
import Link from './components/Link'
import ContactPage from './pages/ContactPage'
import DirectoryPage from './pages/DirectoryPage'
import BusinessPage from './pages/BusinessPage'
import HomePage from './pages/HomePage'
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
    }
    document.title = `${titles[location.pathname] || (location.pathname.startsWith('/bizneset/') ? 'Profili i biznesit' : 'Faqja nuk u gjet')} · Bizneset e Lipjanit`
    document.getElementById('main')?.focus({
      preventScroll: true,
    })
  }, [location.pathname])
  useEffect(() => {
    const restore = () => setLocation(currentLocation())
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  function navigate(href) {
    window.history.pushState(null, '', href)
    setLocation(currentLocation())
    window.scrollTo(0, 0)
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
