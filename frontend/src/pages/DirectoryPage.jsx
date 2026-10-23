import { useEffect, useState } from 'react'
import { getJson } from '../lib/api'
import BusinessCard from '../components/BusinessCard'
import SearchForm from '../components/SearchForm'
import Link from '../components/Link'
import Advertisement from '../components/Advertisement'
import BusinessMap from '../components/BusinessMap'
export default function DirectoryPage({ onOpen, search, navigate }) {
  const params = new URLSearchParams(search)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [options, setOptions] = useState(null)
  const [optionsError, setOptionsError] = useState('')
  const [optionsAttempt, setOptionsAttempt] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setResult(null)
    setError('')
    getJson(`/api/businesses${search}`, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message)
      })
    return () => controller.abort()
  }, [search, attempt])
  useEffect(() => {
    const controller = new AbortController()
    setOptionsError('')
    Promise.all(
      ['categories', 'settlements', 'services'].map((name) =>
        getJson(`/api/${name}`, controller.signal),
      ),
    )
      .then(([categories, settlements, services]) => {
        if (!controller.signal.aborted)
          setOptions({
            category: categories.data,
            settlement: settlements.data,
            service: services.data,
          })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setOptionsError(error.message)
      })
    return () => controller.abort()
  }, [optionsAttempt])
  function changeFilter(name, value) {
    const next = new URLSearchParams(search)
    next.delete('page')
    if (value) next.set(name, value)
    else next.delete(name)
    navigate(`/bizneset${next.size ? `?${next}` : ''}`)
  }
  const clearFilters = () => navigate('/bizneset')
  const activeFilters = [
    'category',
    'settlement',
    'service',
    'has_website',
    'has_hours',
  ].filter((name) => params.get(name) && params.get(name) !== '0').length
  return (
    <section className="container py-12 sm:py-16">
      <p className="eyebrow">Katalogu lokal</p>
      <h1 className="page-title mt-4">Gjej atë që të duhet.</h1>
      <p className="mt-5 max-w-xl leading-7 text-muted">
        Eksploro bizneset dhe shërbimet e komunës së Lipjanit. Të dhënat e
        shënuara “Demo” janë demonstrim.
      </p>
      <div className="mt-8 max-w-3xl">
        <SearchForm
          value={params.get('q') || ''}
          onSearch={(q) => changeFilter('q', q)}
        />
      </div>
      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[240px_1fr]">
        <div className="contents lg:block lg:space-y-6">
          <aside
            className="rounded-2xl border border-line bg-white p-5"
            aria-label="Filtrat e katalogut"
          >
            <h2 className="font-semibold">
              Filtrat{' '}
              {activeFilters > 0 && (
                <span className="text-muted">({activeFilters})</span>
              )}
            </h2>
            <button
              type="button"
              className="button-secondary mt-4 w-full lg:hidden"
              aria-expanded={filtersOpen}
              aria-controls="directory-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              {filtersOpen ? 'Mbyll filtrat' : 'Shfaq filtrat'}
            </button>
            <div
              id="directory-filters"
              className={`${filtersOpen ? 'block' : 'hidden'} mt-5 lg:block`}
            >
              {!options && !optionsError && (
                <p role="status" className="text-sm">
                  Duke ngarkuar filtrat…
                </p>
              )}
              {optionsError && (
                <div role="alert">
                  <p className="text-sm">Filtrat nuk u ngarkuan.</p>
                  <button
                    className="button-secondary mt-3"
                    onClick={() => setOptionsAttempt(optionsAttempt + 1)}
                  >
                    Riprovo filtrat
                  </button>
                </div>
              )}
              {options && (
                <div className="space-y-5">
                  {[
                    ['category', 'Kategoria', 'Të gjitha kategoritë'],
                    ['settlement', 'Vendbanimi', 'Të gjitha vendbanimet'],
                    ['service', 'Shërbimi', 'Të gjitha shërbimet'],
                  ].map(([name, label, placeholder]) => (
                    <label
                      key={name}
                      className="block text-sm font-medium"
                      htmlFor={name}
                    >
                      {label}
                      <select
                        id={name}
                        className="field mt-2 text-sm"
                        value={params.get(name) || ''}
                        onChange={(event) =>
                          changeFilter(name, event.target.value)
                        }
                      >
                        <option value="">{placeholder}</option>
                        {options[name].map((option) => (
                          <option key={option.id} value={option.slug}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              )}
              <div className="mt-6 space-y-3 border-t border-line pt-5">
                {[
                  ['has_website', 'Vetëm me website'],
                  ['has_hours', 'Me orar të publikuar'],
                ].map(([name, label]) => (
                  <label
                    key={name}
                    className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={params.get(name) === '1'}
                      onChange={(event) =>
                        changeFilter(name, event.target.checked ? '1' : '')
                      }
                      className="size-5 shrink-0 accent-forest"
                    />
                    {label}
                  </label>
                ))}
                <p className="text-xs leading-5 text-muted">
                  Orari i publikuar nuk tregon nëse biznesi është i hapur tani.
                </p>
              </div>
              <button
                type="button"
                className="button-secondary mt-5 w-full"
                onClick={clearFilters}
              >
                Pastro filtrat
              </button>
            </div>
          </aside>
          <div className="order-3 lg:order-none">
            <Advertisement placement="results_sidebar" onOpen={onOpen} />
          </div>
        </div>
        <div className="order-2 min-w-0 lg:order-none">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p role="status" className="text-sm text-muted">
              {result
                ? `${result.meta.total} biznese të gjetura`
                : error
                  ? 'Kërkimi nuk u përfundua'
                  : 'Duke ngarkuar bizneset…'}
            </p>
            <label className="flex items-center gap-3 text-sm" htmlFor="sort">
              Renditja
              <select
                id="sort"
                className="field w-auto text-sm"
                value={params.get('sort') || 'name_asc'}
                onChange={(event) => changeFilter('sort', event.target.value)}
              >
                <option value="name_asc">Emri A–Z</option>
                <option value="name_desc">Emri Z–A</option>
                <option value="newest">Më të rejat</option>
              </select>
            </label>
          </div>
          {!result && !error && (
            <div
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
              aria-hidden="true"
            >
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-96 rounded-2xl border border-line bg-white"
                >
                  <div className="h-40 rounded-t-2xl bg-[#e7ecdf]" />
                </div>
              ))}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-line bg-white p-8"
            >
              <h2 className="section-title text-2xl">
                Nuk mund t’i shfaqim bizneset.
              </h2>
              <p className="mt-4 text-muted">{error}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="button-primary"
                  onClick={() => setAttempt(attempt + 1)}
                >
                  Provo përsëri
                </button>
                <button className="button-secondary" onClick={clearFilters}>
                  Pastro filtrat
                </button>
              </div>
            </div>
          )}
          {result && result.data.length === 0 && (
            <div className="rounded-2xl border border-line bg-white p-8 text-center">
              <h2 className="section-title text-2xl">
                {result.meta.total > 0
                  ? 'Kjo faqe nuk ka biznese.'
                  : 'Nuk u gjet asnjë biznes.'}
              </h2>
              <p className="mt-4 text-muted">
                Provo një kërkim tjetër ose pastro filtrat për të parë
                katalogun.
              </p>
              <button className="button-primary mt-6" onClick={clearFilters}>
                Pastro filtrat
              </button>
            </div>
          )}
          {result && result.data.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.data.map((business) => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    onOpen={onOpen}
                  />
                ))}
              </div>
              <BusinessMap
                businesses={result.data}
                navigate={navigate}
                title="Bizneset e kësaj faqeje"
              />
              <Pagination
                meta={result.meta}
                search={search}
                navigate={navigate}
              />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
function Pagination({ meta, search, navigate }) {
  function pageUrl(page) {
    const params = new URLSearchParams(search)
    params.set('page', page)
    return `/bizneset?${params}`
  }
  const pages = [
    ...new Set([
      1,
      meta.current_page - 1,
      meta.current_page,
      meta.current_page + 1,
      meta.last_page,
    ]),
  ]
    .filter((page) => page >= 1 && page <= meta.last_page)
    .sort((a, b) => a - b)
  return (
    <nav
      aria-label="Faqet e rezultateve"
      className="mt-10 border-t border-line pt-6"
    >
      <p className="mb-4 text-sm text-muted">
        {meta.from}–{meta.to} nga {meta.total} biznese · Faqja{' '}
        {meta.current_page} nga {meta.last_page}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {meta.current_page > 1 ? (
          <Link
            href={pageUrl(meta.current_page - 1)}
            navigate={navigate}
            className="button-secondary"
          >
            Prapa
          </Link>
        ) : (
          <span className="button-secondary opacity-40" aria-disabled="true">
            Prapa
          </span>
        )}
        {pages.map((page, index) => (
          <span key={page} className="flex items-center gap-2">
            {index > 0 && page > pages[index - 1] + 1 && (
              <span aria-hidden="true">…</span>
            )}
            <Link
              href={pageUrl(page)}
              navigate={navigate}
              aria-label={`Faqja ${page}`}
              aria-current={page === meta.current_page ? 'page' : undefined}
              className={
                page === meta.current_page
                  ? 'button-primary px-4'
                  : 'button-secondary px-4'
              }
            >
              {page}
            </Link>
          </span>
        ))}
        {meta.current_page < meta.last_page ? (
          <Link
            href={pageUrl(meta.current_page + 1)}
            navigate={navigate}
            className="button-secondary"
          >
            Para
          </Link>
        ) : (
          <span className="button-secondary opacity-40" aria-disabled="true">
            Para
          </span>
        )}
      </div>
    </nav>
  )
}
