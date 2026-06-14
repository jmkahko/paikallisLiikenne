import { useEffect, useRef, useState } from 'react'
import { searchStops } from '../api/digitransit.js'

// Montako merkkiä pitää syöttää ennen kuin hakua tehdään.
const MIN_QUERY_LENGTH = 2

export default function StopSearch({ onSelect, disabled, disabledReason }) {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Tosi vasta kun haku on suoritettu — erottaa "ei vielä haettu" tilan
  // tilasta "haettiin, mutta ei löytynyt".
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef(null)

  const query = term.trim()
  const tooShort = query.length > 0 && query.length < MIN_QUERY_LENGTH

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < MIN_QUERY_LENGTH) {
      setResults([])
      setError(null)
      setHasSearched(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const stops = await searchStops(query)
        setResults(stops)
        setError(null)
        setHasSearched(true)
      } catch (e) {
        setError(e.message)
        setResults([])
        setHasSearched(false)
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function handleSelect(stop) {
    onSelect(stop)
    setTerm('')
    setResults([])
    setHasSearched(false)
  }

  const noResults =
    !loading && !error && hasSearched && results.length === 0

  return (
    <div className="stop-search">
      <label htmlFor="stop-search-input" className="stop-search__label">
        Lisää pysäkki
      </label>
      <input
        id="stop-search-input"
        type="text"
        className="stop-search__input"
        placeholder="Hae pysäkin nimellä tai koodilla (esim. Keskustori, 0001)"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        disabled={disabled}
      />
      {disabled && disabledReason && (
        <p className="stop-search__hint">{disabledReason}</p>
      )}
      {!disabled && tooShort && (
        <p className="stop-search__hint">
          Syötä vähintään {MIN_QUERY_LENGTH} merkkiä hakeaksesi pysäkkejä.
        </p>
      )}
      {loading && <p className="stop-search__hint">Haetaan…</p>}
      {error && <p className="stop-search__error">Virhe: {error}</p>}
      {noResults && (
        <p className="stop-search__hint">
          Ei pysäkkejä haulla ”{query}”. Kokeile pysäkin nimeä tai koodia.
        </p>
      )}
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
