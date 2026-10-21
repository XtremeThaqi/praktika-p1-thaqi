import { useEffect, useState } from 'react'

export default function ConnectionStatus() {
  const [status, setStatus] = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [businesses, setBusinesses] = useState([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    let active = true

    async function checkConnection() {
      try {
        const response = await fetch('/api/businesses', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        const data = await response.json()

        if (!response.ok || !Array.isArray(data.data) || !Number.isInteger(data.meta?.total)) {
          throw new Error('Service unavailable')
        }

        if (active) {
          setBusinesses(data.data)
          setTotal(data.meta.total)
          setStatus('connected')
        }
      } catch {
        if (active) setStatus('error')
      } finally {
        clearTimeout(timeout)
      }
    }

    checkConnection()

    return () => {
      active = false
      controller.abort()
      clearTimeout(timeout)
    }
  }, [attempt])

  return (
    <section className="mt-10 max-w-xl rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="font-semibold">Kontrolli i lidhjes gjatë zhvillimit</h2>
      <p className="mt-2 text-sm text-slate-600" role="status">
        {status === 'loading' && 'Duke marrë bizneset nga katalogu…'}
        {status === 'connected' && `U morën ${businesses.length} nga ${total} biznese të publikuara.`}
        {status === 'error' && 'Lidhja nuk u realizua. Kontrolloni shërbimin dhe provoni përsëri.'}
      </p>
      {status === 'connected' && (
        businesses.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm" aria-label="Bizneset nga baza e të dhënave">
            {businesses.map(business => (
              <li key={business.id}>
                {business.name}
                {business.settlement && ` — ${business.settlement.name}`}
                {business.is_demo && <span className="ml-2 text-slate-500">Të dhëna demonstrimi</span>}
              </li>
            ))}
          </ul>
        ) : <p className="mt-4 text-sm">Nuk ka biznese të publikuara.</p>
      )}
      {status === 'error' && (
        <button
          type="button"
          className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          onClick={() => {
            setStatus('loading')
            setAttempt(value => value + 1)
          }}
        >
          Provo përsëri
        </button>
      )}
    </section>
  )
}
