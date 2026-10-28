import { useEffect, useState } from 'react'
import { getJson, safeWebsite } from '../lib/api'
import { phoneUrl, emailUrl, directionsUrl } from '../lib/business'
import Link from '../components/Link'
import Icon from '../components/Icon'
import BusinessMap from '../components/BusinessMap'

const days = [
  'E diel',
  'E hënë',
  'E martë',
  'E mërkurë',
  'E enjte',
  'E premte',
  'E shtunë',
]

export default function BusinessPage({ slug, navigate }) {
  const [business, setBusiness] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setBusiness(null)
    setError(null)
    getJson(`/api/businesses/${encodeURIComponent(slug)}`, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setBusiness(result.data)
          document.title = `${result.data.name} · Bizneset e Lipjanit`
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error)
      })
    return () => controller.abort()
  }, [slug, attempt])

  return (
    <section className="container py-10 sm:py-14">
      <Link
        href="/bizneset"
        navigate={navigate}
        className="mb-7 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-forest underline-offset-4 hover:underline"
      >
        ← Kthehu te bizneset
      </Link>
      {!business && !error && <p role="status">Duke ngarkuar profilin…</p>}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-line bg-white p-8"
        >
          <h1 className="section-title">
            {error.status === 404
              ? 'Biznesi nuk u gjet.'
              : 'Profili nuk u ngarkua.'}
          </h1>
          <p className="mt-4">{error.message}</p>
          {error.status !== 404 && (
            <button
              className="button-primary mt-6"
              onClick={() => setAttempt(attempt + 1)}
            >
              Provo përsëri
            </button>
          )}
        </div>
      )}
      {business && (
        <>
          <header className="rounded-2xl border border-line bg-white p-6 sm:p-9 lg:p-10">
            <p className="eyebrow">{business.category?.name || 'Biznes lokal'}</p>
            <h1 className="page-title mt-4 max-w-4xl break-words">{business.name}</h1>
            <p className="mt-5 flex items-start gap-2 break-words text-sm leading-6 text-muted sm:text-base">
              <Icon name="pin" className="mt-1 size-5 shrink-0 text-forest" />
              <span>
                {[business.settlement?.name, business.address].filter(Boolean).join(' · ') ||
                  'Adresa nuk është publikuar.'}
              </span>
            </p>
            {business.is_demo && (
              <p className="mt-6 max-w-3xl rounded-xl border border-amber/40 bg-amber/15 p-4 text-sm leading-6">
                Të dhëna demonstrimi. Kontaktet, imazhet dhe koordinatat janë të
                simuluara, jo informacion i verifikuar.
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3 border-t border-line pt-6">
              {phoneUrl(business.phone) && (
                <a className="button-primary" href={phoneUrl(business.phone)}>
                  Telefono
                </a>
              )}
              {directionsUrl(business) && (
                <a
                  className="button-secondary"
                  href={directionsUrl(business)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Shiko udhëzimet
                </a>
              )}
              {emailUrl(business.email) && (
                <a className="button-secondary" href={emailUrl(business.email)}>
                  Dërgo email
                </a>
              )}
              {safeWebsite(business.website) && (
                <a
                  className="button-secondary"
                  href={safeWebsite(business.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </a>
              )}
            </div>
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 break-words text-sm text-muted">
              {business.phone && (
                <div>
                  <dt className="inline font-semibold">Telefon: </dt>
                  <dd className="inline">{business.phone}</dd>
                </div>
              )}
              {business.email && (
                <div>
                  <dt className="inline font-semibold">Email: </dt>
                  <dd className="inline">{business.email}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(business.social_links || {}).map(
                ([name, url]) =>
                  safeWebsite(url) && (
                    <a
                      key={name}
                      className="break-all rounded text-sm font-medium text-forest underline underline-offset-4"
                      href={safeWebsite(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {name}
                    </a>
                  )
              )}
            </div>
          </header>
          <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-7">
              <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
                <h2 className="section-title">Rreth biznesit</h2>
                <p className="mt-5 max-w-prose whitespace-pre-line break-words leading-8 text-muted">
                  {business.description || 'Përshkrimi nuk është publikuar.'}
                </p>
                <h2 className="mt-8 text-xl font-semibold">Shërbimet</h2>
                {business.services.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {business.services.map((service) => (
                      <li
                        key={service.id}
                        className="break-words rounded-lg border border-forest/10 bg-[#eaf0e6] px-4 py-2 text-sm text-forest"
                      >
                        {service.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-muted">
                    Shërbimet nuk janë publikuar.
                  </p>
                )}
              </section>
              <section className="rounded-2xl border border-line bg-white p-6 sm:p-8">
                <h2 className="section-title mb-5">Logo dhe fotografi</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {business.images.length ? (
                    business.images.map((image) => (
                      <ProfileImage
                        key={image.id}
                        image={image}
                        name={business.name}
                      />
                    ))
                  ) : (
                    <ProfileImage name={business.name} />
                  )}
                </div>
              </section>
            </div>
            <section className="rounded-2xl border border-line bg-[#f1f3ea] p-6 sm:p-8">
              <h2 className="section-title text-2xl">Orari i punës</h2>
              {business.hours.length ? (
                <>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Orari i publikuar; nuk tregon statusin “Hapur tani”.
                    Intervali që kalon mesnatën mbaron ditën pasuese.
                  </p>
                  <dl className="mt-5 divide-y divide-line">
                    {[...business.hours]
                      .sort(
                        (a, b) =>
                          ((a.day_of_week + 6) % 7) - ((b.day_of_week + 6) % 7)
                      )
                      .map((hour) => (
                        <div
                          key={hour.day_of_week}
                          className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                        >
                          <dt className="font-medium">{days[hour.day_of_week]}</dt>
                          <dd className="text-muted">
                            {hour.is_closed
                              ? 'Mbyllur'
                              : `${hour.opens_at?.slice(0, 5)}–${hour.closes_at?.slice(0, 5)}`}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </>
              ) : (
                <p className="mt-5 text-muted">Orari nuk është publikuar</p>
              )}
            </section>
          </div>
          <BusinessMap businesses={[business]} navigate={navigate} />
        </>
      )}
    </section>
  )
}

function ProfileImage({ image, name }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-line bg-[#eaf0e6]">
      {image && !failed ? (
        <img
          src={image.path}
          alt={image.alt_text || name}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 text-forest">
          <Icon name="shop" className="size-12" />
          <span className="text-sm">Fotografia nuk është në dispozicion.</span>
        </div>
      )}
    </div>
  )
}
