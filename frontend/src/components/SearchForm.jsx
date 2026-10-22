import { useEffect, useState } from 'react'
import Icon from './Icon'
export default function SearchForm({
  value = '',
  onSearch,
  id = 'business-search',
}) {
  const [term, setTerm] = useState(value)
  useEffect(() => setTerm(value), [value])
  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-2 shadow-sm sm:flex-row"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(term.trim())
      }}
    >
      <label
        className="flex min-w-0 flex-1 items-center gap-3 px-3"
        htmlFor={id}
      >
        <Icon name="search" className="size-5 shrink-0 text-forest" />
        <span className="sr-only">Kërko biznes ose shërbim</span>
        <input
          id={id}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Kërko biznes ose shërbim"
          maxLength={200}
          className="min-h-12 min-w-0 w-full bg-transparent text-base outline-offset-4"
        />
      </label>
      <button className="button-primary" type="submit">
        Kërko <Icon />
      </button>
    </form>
  )
}
