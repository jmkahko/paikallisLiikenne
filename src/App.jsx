import StopSearch from './components/StopSearch.jsx'
import StopCard from './components/StopCard.jsx'
import PrivacyBanner from './components/PrivacyBanner.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'

const MAX_STOPS = 6
const STORAGE_KEY = 'paikallis.stops.v1'

export default function App() {
  const [stops, setStops] = useLocalStorage(STORAGE_KEY, [])

  function addStop(stop) {
    setStops((prev) => {
      if (prev.length >= MAX_STOPS) return prev
      if (prev.some((s) => s.gtfsId === stop.gtfsId)) return prev
      return [
        ...prev,
        {
          gtfsId: stop.gtfsId,
          name: stop.name,
          code: stop.code,
          vehicleMode: stop.vehicleMode
        }
      ]
    })
  }

  function removeStop(gtfsId) {
    setStops((prev) => prev.filter((s) => s.gtfsId !== gtfsId))
  }

  function moveStop(gtfsId, delta) {
    setStops((prev) => {
      const i = prev.findIndex((s) => s.gtfsId === gtfsId)
      if (i < 0) return prev
      const j = i + delta
      if (j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(i, 1)
      copy.splice(j, 0, item)
      return copy
    })
  }

  const isFull = stops.length >= MAX_STOPS

  return (
    <div className="app">
      <header className="app__header">
        <h1>
          <span aria-hidden="true">🚋</span> Paikallisliikenne
        </h1>
        <p className="app__subtitle">
          Reaaliaikaiset Nysse-lähdöt — valitse jopa {MAX_STOPS} pysäkkiä.
        </p>
      </header>

      <section className="controls">
        <StopSearch
          onSelect={addStop}
          disabled={isFull}
          disabledReason={
            isFull
              ? `Maksimimäärä (${MAX_STOPS}) pysäkkiä lisätty. Poista jokin ennen uutta.`
              : null
          }
        />
        <p className="controls__count">
          {stops.length} / {MAX_STOPS} pysäkkiä
        </p>
      </section>

      {stops.length === 0 ? (
        <div className="empty-state">
          <p>Ei vielä pysäkkejä.</p>
          <p>Etsi pysäkki yltä ja lisää se klikkaamalla tulosta.</p>
        </div>
      ) : (
        <div className="stop-grid">
          {stops.map((stop, idx) => (
            <StopCard
              key={stop.gtfsId}
              stop={stop}
              isFirst={idx === 0}
              isLast={idx === stops.length - 1}
              onRemove={() => removeStop(stop.gtfsId)}
              onMove={(delta) => moveStop(stop.gtfsId, delta)}
            />
          ))}
        </div>
      )}

      <PrivacyBanner />

      <footer className="app__footer">
        <p>
          Tiedot:{' '}
          <a
            href="https://digitransit.fi/"
            target="_blank"
            rel="noreferrer"
          >
            Digitransit
          </a>{' '}
          / Nysse (Tampere). Aineistolisenssi CC BY 4.0.
        </p>
      </footer>
    </div>
  )
}
