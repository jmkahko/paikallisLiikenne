import { useEffect, useRef, useState } from 'react'
import { searchStops } from '../api/digitransit.js'

export default function StopSearch({ onSelect, disabled, disabledReason }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!term.trim()) {
      setResults([])
      setError(null)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const stops = await searchStops(term)
        setResults(stops)
        setError(null)
      } catch (e) {
        setError(e.message)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [term])

  function handleSelect(stop) {
    onSelect(stop)
    setTerm('')
    setResults([])
  }

  return (
    <div className="stop-search">
      <label htmlFor="stop-search-input" className="stop-search__label">
        Lisää pysäkki
      </label>
      <input
        id="stop-search-input"
        type="text"
        className="stop-search__input"
        placeholder="Hae pysäkin nimellä tai koodilla (esim. Keskustori, 0501)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        disabled={disabled}
      />
      {disabled && disabledReason && (
        <p className="stop-search__hint">{disabledReason}</p>
      )}
      {loading && <p className="stop-search__hint">Haetaan…</p>}
      {error && <p className="stop-search__error">Virhe: {error}</p>}
      {results.length > 0 && (
        <ul className="stop-search__results">
          {results.map((s) => (
            <li key={s.gtfsId}>
              <button
                type="button"
                className="stop-search__result"
                onClick={() => handleSelect(s)}
              >
                <span className={`mode-dot mode-${(s.vehicleMode || 'BUS').toLowerCase()}`} />
                <span className="stop-search__result-name">{s.name}</span>
                {s.code && <span className="stop-search__result-code">#{s.code}</span>}
                {s.desc && <span className="stop-search__result-desc">{s.desc}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
