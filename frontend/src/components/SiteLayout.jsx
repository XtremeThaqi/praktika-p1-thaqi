import { useEffect, useState } from 'react'
import Link from './Link'
import Icon from './Icon'
export default function SiteLayout({ children, pathname, navigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigation = [
    {
      href: '/',
      label: 'Ballina',
    },
    {
      href: '/bizneset',
      label: 'Bizneset',
    },
    {
      href: '/kontakt',
      label: 'Kontakt',
    },
  ]
  useEffect(() => setMenuOpen(false), [pathname])
  function navigationLinks() {
    return navigation.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        navigate={navigate}
        aria-current={
          pathname === item.href ||
          (item.href === '/bizneset' && pathname.startsWith('/bizneset/'))
            ? 'page'
            : undefined
        }
        className={`nav-link ${pathname === item.href || (item.href === '/bizneset' && pathname.startsWith('/bizneset/')) ? 'nav-link-active' : ''}`}
      >
        {item.label}
      </Link>
    ))
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Kalo te përmbajtja
      </a>
      <header className="border-b border-line bg-paper">
        <div className="container flex min-h-20 items-center justify-between gap-4">
          <Link
            href="/"
            navigate={navigate}
            className="flex min-w-0 items-center gap-3"
            aria-label="Bizneset e Lipjanit — Ballina"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <Icon name="shop" className="size-6" />
            </span>
            <span className="min-w-0 text-lg font-semibold leading-tight tracking-tight">
              Bizneset{' '}
              <span className="block text-sm font-normal tracking-normal text-muted">
                e Lipjanit
              </span>
            </span>
          </Link>
          <nav
            className="hidden items-center gap-8 md:flex"
            aria-label="Navigimi kryesor"
          >
            {navigationLinks()}
          </nav>
          <span className="hidden text-xs font-medium uppercase tracking-widest text-muted lg:block">
            Lidhje me jetën lokale
          </span>
          <button
            type="button"
            className="icon-button md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Mbyll menynë' : 'Hap menynë'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="container flex flex-col gap-1 border-t border-line py-3 md:hidden"
            aria-label="Navigimi në telefon"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setMenuOpen(false)
                document
                  .querySelector('[aria-controls="mobile-navigation"]')
                  ?.focus()
              }
            }}
          >
            {navigationLinks()}
          </nav>
        )}
      </header>
      <main id="main" tabIndex="-1">
        {children}
      </main>
      <footer className="mt-12 bg-forest text-white sm:mt-16">
        <div className="container grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl">Njih më mirë vendin tënd.</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Një hapësirë për të eksploruar biznese dhe shërbime në zonën e Lipjanit.
            </p>
          </div>
          <nav
            className="flex flex-col items-start gap-3 text-sm"
            aria-label="Navigimi në fund të faqes"
          >
            <p className="mb-1 text-xs uppercase tracking-widest text-white/60">
              Eksploro
            </p>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                navigate={navigate}
                className="footer-link"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">
              Rreth platformës
            </p>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Projekt studentor i praktikës profesionale. Nuk është regjistër
              zyrtar i komunës.
            </p>
          </div>
        </div>
        <div className="container border-t border-white/15 py-6 text-xs leading-6 text-white/60">
          Bizneset e Lipjanit · Katalogu i këtij projekti studentor përmban profile ilustruese, jo biznese të verifikuara.
        </div>
      </footer>
    </>
  )
}
