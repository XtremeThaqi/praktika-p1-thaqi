import { useEffect, useState } from 'react'
import AdminLayout from './AdminLayout'
import { adminRequest } from '../lib/admin'

const sections = {
  categories: {
    title: 'Kategoritë',
    singular: 'kategori',
    description: 'Organizoni bizneset sipas llojit të veprimtarisë.',
  },
  settlements: {
    title: 'Vendbanimet',
    singular: 'vendbanim',
    description: 'Mbani të përditësuara vendbanimet e bizneseve.',
  },
  services: {
    title: 'Shërbimet',
    singular: 'shërbim',
    description: 'Menaxhoni shërbimet që lidhen me bizneset.',
  },
}

export default function AdminTaxonomyPage({ kind, navigate, onLogout, onSessionExpired }) {
  const section = sections[kind]
  const path = `/api/admin/${kind}`
  const [items, setItems] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setItems(null)
    setError('')
    const query = search ? `?q=${encodeURIComponent(search)}` : ''
    adminRequest(path + query)
      .then((result) => { if (active) setItems(result.data) })
      .catch((problem) => {
        if (!active) return
        if (problem.status === 401 || problem.status === 403) onSessionExpired()
        else setError(problem.message)
      })
    return () => { active = false }
  }, [path, search, retry, onSessionExpired])

  function reportError(problem) {
    if (problem.status === 401 || problem.status === 403) {
      onSessionExpired()
      return
    }
    setErrors(problem.errors || {})
    setError(problem.message)
  }

  async function createItem(event) {
    event.preventDefault()
    setEditingId(null)
    setBusy(true)
    setError('')
    setErrors({})
    setFeedback('')
    try {
      await adminRequest(path, { method: 'POST', body: JSON.stringify({ name }) })
      setName('')
      setSearchText('')
      setSearch('')
      setFeedback(`U shtua ${section.singular}.`)
      setRetry((count) => count + 1)
    } catch (problem) {
      reportError(problem)
    } finally {
      setBusy(false)
    }
  }

  async function updateItem(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    setFeedback('')
    try {
      await adminRequest(`${path}/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName }),
      })
      setEditingId(null)
      setFeedback('Emri u përditësua. Adresa URL mbetet e njëjtë.')
      setRetry((count) => count + 1)
    } catch (problem) {
      reportError(problem)
    } finally {
      setBusy(false)
    }
  }

  async function deleteItem(item) {
    let body
    if (kind === 'services') {
      const answer = window.prompt(
        `Fshirja e shërbimit “${item.name}” heq lidhjen nga ${item.businesses_count} biznese, pa fshirë bizneset. Shkruani emrin e saktë për ta konfirmuar:`,
        ''
      )
      if (answer === null) return
      body = JSON.stringify({ confirm_name: answer })
    } else if (!window.confirm(`A dëshironi ta fshini “${item.name}”? Kjo lejohet vetëm nëse nuk përdoret nga asnjë biznes.`)) {
      return
    }

    setBusy(true)
    setError('')
    setErrors({})
    setFeedback('')
    try {
      await adminRequest(`${path}/${item.id}`, { method: 'DELETE', body })
      setFeedback('Zëri u fshi.')
      setRetry((count) => count + 1)
    } catch (problem) {
      reportError(problem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title={section.title} current={kind} navigate={navigate} onLogout={onLogout}>
      <p className="mt-5 text-sm text-muted">{section.description}</p>

      <form onSubmit={createItem} className="mt-7 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-forest">Shto {section.singular}</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-sm font-semibold">
            Emri
            <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'create-name-error' : undefined}
              maxLength="120" required />
          </label>
          <button type="submit" className="button-primary" disabled={busy}>Shto</button>
        </div>
        {errors.name && !editingId && <p id="create-name-error" className="mt-2 text-sm text-red-900">{errors.name[0]}</p>}
      </form>

      <form onSubmit={(event) => { event.preventDefault(); setSearch(searchText.trim()) }}
        className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold">
          Kërko sipas emrit
          <input className="field mt-2" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </label>
        <button type="submit" className="button-secondary">Kërko</button>
      </form>

      {feedback && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-900">{feedback}</p>}
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
        <p>{error}</p>
        {items === null && <button type="button" className="mt-2 underline" onClick={() => setRetry((count) => count + 1)}>Provo përsëri</button>}
      </div>}
      {items === null && !error && <p role="status" className="mt-6">Duke ngarkuar {section.title.toLowerCase()}…</p>}
      {items && <>
        <p className="mt-6 text-sm text-muted">{items.length} rezultate</p>
        {items.length === 0 && <p className="mt-4 rounded-2xl border border-line bg-white p-6">Nuk u gjet asnjë zë.</p>}
        <ul className="mt-4 space-y-3">
          {items.map((item) => <li key={item.id} className="rounded-2xl border border-line bg-white p-5">
            {editingId === item.id ? (
              <form onSubmit={updateItem} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1 text-sm font-semibold">Emri
                  <input className="field mt-2" value={editName} onChange={(event) => setEditName(event.target.value)}
                    aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'edit-name-error' : undefined}
                    maxLength="120" required />
                  {errors.name && <span id="edit-name-error" className="mt-2 block text-red-900">{errors.name[0]}</span>}
                </label>
                <button type="submit" className="button-primary" disabled={busy}>Ruaj</button>
                <button type="button" className="button-secondary" disabled={busy} onClick={() => { setEditingId(null); setErrors({}); setError('') }}>Anulo</button>
              </form>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="break-words font-display text-lg font-semibold text-forest">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted">{item.businesses_count} biznese · /{item.slug}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="font-semibold text-forest underline" disabled={busy}
                    onClick={() => { setEditingId(item.id); setEditName(item.name); setErrors({}); setError(''); setFeedback('') }}>Ndrysho</button>
                  <button type="button" className="font-semibold text-red-900 underline" disabled={busy}
                    onClick={() => deleteItem(item)}>Fshi</button>
                </div>
              </div>
            )}
          </li>)}
        </ul>
      </>}
    </AdminLayout>
  )
}
