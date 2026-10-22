import { useEffect, useState } from 'react'
import { getJson } from '../lib/api'
import BusinessCard from '../components/BusinessCard'

export default function DirectoryPage({ onOpen }) {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setResult(null)
    setError('')
    getJson('/api/businesses', controller.signal).then(setResult)
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [attempt])

  return (
    <section className="container py-12 sm:py-16">
      <p className="eyebrow">Katalogu lokal</p>
      <h1 className="page-title mt-4">Gjej atë që të duhet.</h1>
      <p className="mt-5 max-w-xl leading-7 text-muted">Eksploro bizneset dhe shërbimet e komunës së Lipjanit.</p>
      <div className="mt-10">
        {!result && !error && <p role="status">Duke ngarkuar bizneset…</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" className="button-secondary mt-4" onClick={() => setAttempt(attempt + 1)}>Provo përsëri</button></div>}
        {result && <><p role="status" className="mb-6 text-sm text-muted">{result.meta.total} biznese të publikuara</p><div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{result.data.map(business => <BusinessCard key={business.id} business={business} onOpen={onOpen} />)}</div></>}
      </div>
    </section>
  )
}
