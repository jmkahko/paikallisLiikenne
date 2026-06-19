import { useState } from 'react'
import StopSearch from './components/StopSearch.jsx'
import StopCard from './components/StopCard.jsx'
import PrivacyBanner from './components/PrivacyBanner.jsx'
import About from './components/About.jsx'
import Alerts from './components/Alerts.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useAlerts } from './hooks/useAlerts.js'
import { useStopRoutes } from './hooks/useStopRoutes.js'

const MAX_STOPS = 6
const STORAGE_KEY = 'paikallis.stops.v1'
const DEPARTURE_COUNT_KEY = 'paikallis.departureCount.v1'
const DEFAULT_DEPARTURE_COUNT = 5
const DEPARTURE_COUNT_OPTIONS = [1, 2, 3, 4, 5]

export default function App() {
  const [stops, setStops] = useLocalStorage(STORAGE_KEY, [])
  const [departureCount, setDepartureCount] = useLocalStorage(
    DEPARTURE_COUNT_KEY,
    DEFAULT_DEPARTURE_COUNT
  )
  const [aboutOpen, setAboutOpen] = useState(false)
  const { alerts, error: alertsError, loading: alertsLoading } = useAlerts()
  const stopIds = stops.map((s) => s.gtfsId)
  const selectedStopIds = new Set(stopIds)
  const { routeNames: selectedRouteNames } = useStopRoutes(stopIds)

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
        <div className="app__header-content">
          <div>
            <h1>
              <span aria-hidden="true">🚋</span> Paikallisliikenne
            </h1>
            <p className="app__subtitle">
              Reaaliaikaiset Nysse-lähdöt — valitse jopa {MAX_STOPS} pysäkkiä.
            </p>
          </div>
          <button
            className="app__about-btn"
            onClick={() => setAboutOpen(true)}
            aria-label="Tietoja sovelluksesta"
            title="Tietoja sovelluksesta"
          >
            ℹ️
          </button>
        </div>
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
        <div className="controls__row">
          <p className="controls__count">
            {stops.length} / {MAX_STOPS} pysäkkiä
          </p>
          <div className="controls__departures">
            <label htmlFor="departure-count">Lähtöjä per pysäkki</label>
            <select
              id="departure-count"
              value={departureCount}
              onChange={(e) => setDepartureCount(Number(e.target.value))}
            >
              {DEPARTURE_COUNT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <Alerts
        alerts={alerts}
        loading={alertsLoading}
        error={alertsError}
        selectedStopIds={selectedStopIds}
        selectedRouteNames={selectedRouteNames}
      />

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
              departureCount={departureCount}
              isFirst={idx === 0}
              isLast={idx === stops.length - 1}
              onRemove={() => removeStop(stop.gtfsId)}
              onMove={(delta) => moveStop(stop.gtfsId, delta)}
            />
          ))}
        </div>
      )}

      <PrivacyBanner />
      <About isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      <footer className="app__footer">
        <p>
          Tiedot: © <a
            href="https://digitransit.fi/"
            target="_blank"
            rel="noreferrer"
          >
            Digitransit
          </a>{' '}
          {new Date().getFullYear()}/{' '}
          <a
            href="https://www.nysse.fi/"
            target="_blank"
            rel="noreferrer"
          >
            Nysse (Tampere)
          </a>
          . Aineistolisenssi{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>
          .
        </p>
      </footer>
    </div>
  )
}
