import { useEffect, useState } from 'react'
import { getJson } from '../lib/api'
import SearchForm from '../components/SearchForm'
import Link from '../components/Link'
import Icon from '../components/Icon'
import BusinessCard from '../components/BusinessCard'
import Advertisement from '../components/Advertisement'
export default function HomePage({ navigate, onOpen }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    Promise.all([
      getJson('/api/categories', controller.signal),
      getJson('/api/businesses', controller.signal),
    ])
      .then(([categories, businesses]) => {
        if (!controller.signal.aborted)
          setData({
            categories: categories.data,
            businesses: businesses.data.slice(0, 6),
          })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message)
      })
    return () => controller.abort()
  }, [attempt])
  return (
    <>
      <section className="container grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14 lg:py-20">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-2">
            <span className="size-2 rounded-full bg-forest" />
            Pranë teje, në Lipjan
          </p>
          <h1 className="page-title mt-5 text-[clamp(2.7rem,6vw,4.5rem)]">
            Gjeje pranë.
            <br />
            <span className="text-forest">Gjeje në Lipjan.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Një vend për të zbuluar bizneset, shërbimet dhe mundësitë që ofron
            komuna jonë.
          </p>
          <div className="mt-7 max-w-xl">
            <SearchForm
              onSearch={(q) =>
                navigate(`/bizneset${q ? `?q=${encodeURIComponent(q)}` : ''}`)
              }
            />
          </div>
          <p className="mt-4 text-xs leading-6 text-muted">
            Projekt studentor · Katalogu përmban të dhëna demonstrimi.
          </p>
        </div>
        <div
          className="relative min-w-0 rounded-[1.75rem] border border-forest/10 bg-[#e7ecdf] px-6 pt-7 pb-6 sm:px-9 sm:pt-9"
          aria-label="Ilustrim i dyqaneve lokale"
          role="img"
        >
          <p className="font-display text-[clamp(1.65rem,3vw,2.2rem)] leading-tight text-forest">
            Një komunë.
            <br />
            Shumë mundësi.
          </p>
          <svg
            viewBox="0 0 420 290"
            className="mx-auto mt-4 max-h-72 w-full"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="336" cy="57" r="28" fill="#eec461" />
            <path d="M8 255h404" stroke="#173f35" strokeWidth="2" />
            <path
              d="M48 125h164v130H48z"
              fill="#faf8ef"
              stroke="#173f35"
              strokeWidth="2"
            />
            <path d="M37 125h186l-14-44H51z" fill="#173f35" />
            <path
              d="M56 125v20m28-20v20m28-20v20m28-20v20m28-20v20m28-20v20"
              stroke="#eec461"
              strokeWidth="17"
            />
            <path
              d="M68 167h56v63H68zM143 167h47v88h-47z"
              fill="#dce7df"
              stroke="#173f35"
              strokeWidth="2"
            />
            <path d="M96 167v63m-28-32h56" stroke="#173f35" />
            <path
              d="M238 103h127v152H238z"
              fill="#d9b698"
              stroke="#173f35"
              strokeWidth="2"
            />
            <path d="M230 103h143V87H230z" fill="#173f35" />
            <path d="M252 126h99v28h-99z" fill="#faf8ef" />
            <path
              d="M255 177h37v78h-37zM309 177h37v47h-37z"
              fill="#e7ecdf"
              stroke="#173f35"
              strokeWidth="2"
            />
            <path
              d="M22 225v30m-9-13h18m366-28v41"
              stroke="#173f35"
              strokeWidth="3"
            />
            <circle cx="397" cy="198" r="22" fill="#66846b" />
            <path
              d="M12 264h395"
              stroke="#173f35"
              strokeOpacity=".15"
              strokeWidth="5"
            />
          </svg>
          <p className="mt-2 flex items-center gap-2 text-sm text-forest">
            <Icon name="pin" />
            Lipjan dhe vendbanimet përreth
          </p>
        </div>
      </section>
      <section className="border-y border-line bg-white/65 py-12 sm:py-16">
        <div className="container">
          <p className="eyebrow">Nis nga ajo që të duhet</p>
          <h2 className="section-title mt-3">Eksploro sipas kategorisë</h2>
          {!data && !error && (
            <p role="status" className="mt-8">
              Duke ngarkuar katalogun…
            </p>
          )}
          {error && (
            <div role="alert" className="mt-8">
              <p>{error}</p>
              <button
                className="button-secondary mt-4"
                onClick={() => setAttempt(attempt + 1)}
              >
                Provo përsëri
              </button>
            </div>
          )}
          {data && data.categories.length === 0 && (
            <p className="mt-8 rounded-xl border border-line bg-white p-6 text-muted">
              Kategoritë nuk janë publikuar ende. Mund t’i shohësh bizneset në katalog.
            </p>
          )}
          {data && data.categories.length > 0 && (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.categories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/bizneset?category=${encodeURIComponent(category.slug)}`}
                  navigate={navigate}
                  className="group flex min-h-24 min-w-0 items-center gap-4 rounded-xl border border-line bg-white p-5 transition-[border-color,background-color,transform] hover:border-forest/50 hover:bg-[#eef2e9] focus-visible:border-forest"
                >
                  <span className="shrink-0 font-display text-2xl text-muted/70">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1 break-words font-semibold leading-snug">{category.name}</span>
                  <Icon className="size-5 shrink-0 text-forest" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="container py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Nga katalogu</p>
            <h2 className="section-title mt-3">Njih bizneset e zonës</h2>
            <p className="mt-3 text-muted">
              Një përzgjedhje nga bizneset e publikuara në katalog.
            </p>
          </div>
          <Link
            href="/bizneset"
            navigate={navigate}
            className="button-secondary"
          >
            Të gjitha bizneset <Icon />
          </Link>
        </div>
        {!data && !error && (
          <div
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            aria-hidden="true"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-line bg-white"
              >
                <div className="aspect-[16/10] bg-[#e7ecdf]" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-20 rounded bg-[#e7ecdf]" />
                  <div className="h-6 w-3/4 rounded bg-[#e7ecdf]" />
                  <div className="h-4 w-1/2 rounded bg-[#e7ecdf]" />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && !data && (
          <p className="mt-8 rounded-2xl border border-line bg-white p-7 text-muted">
            Bizneset e përzgjedhura nuk u ngarkuan. Provo përsëri te seksioni i
            kategorive.
          </p>
        )}
        {data && data.businesses.length > 0 && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.businesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onOpen={onOpen}
              />
            ))}
          </div>
        )}
        {data && data.businesses.length === 0 && (
          <p className="mt-8 rounded-2xl border border-line bg-white p-7 text-muted">
            Nuk ka biznese të publikuara për t’u shfaqur këtu ende.
          </p>
        )}
      </section>
      <div className="container pb-12 sm:pb-16">
        <Advertisement placement="home_banner" onOpen={onOpen} />
      </div>
    </>
  )
}
