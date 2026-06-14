import { useEffect, useState } from 'react'
import { useDepartures } from '../hooks/useDepartures.js'

const MODE_LABEL = {
  BUS: 'Bussi',
  TRAM: 'Raitiovaunu',
  RAIL: 'Juna',
  FERRY: 'Lautta',
  SUBWAY: 'Metro'
}

function formatRelative(date, now) {
  const diffMs = date.getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes <= 0) return 'nyt'
  if (minutes === 1) return '1 min'
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} t` : `${h} t ${m} min`
}

function formatClock(date) {
  return date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}

export default function StopCard({ stop, departureCount = 5, onRemove, onMove, isFirst, isLast }) {
  const { data, error, loading, lastUpdated, refresh } = useDepartures(
    stop.gtfsId,
    30_000,
    departureCount
  )
  const [now, setNow] = useState(() => new Date())

  // Päivitä "min"-laskuri sekunnin välein, jotta luvut juoksevat sujuvasti.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const departures = data?.departures ?? []
  const mode = (data?.stop?.vehicleMode || stop.vehicleMode || 'BUS').toUpperCase()

  return (
    <article className={`stop-card stop-card--${mode.toLowerCase()}`}>
      <header className="stop-card__header">
        <div className="stop-card__title">
          <span className={`mode-dot mode-${mode.toLowerCase()}`} aria-hidden="true" />
          <div>
            <h2 className="stop-card__name">{stop.name}</h2>
            <p className="stop-card__meta">
              {stop.code && <span>#{stop.code}</span>}
              <span>{MODE_LABEL[mode] || mode}</span>
            </p>
          </div>
        </div>
        <div className="stop-card__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            title="Siirrä ylös"
            aria-label="Siirrä ylös"
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(1)}
            disabled={isLast}
            title="Siirrä alas"
            aria-label="Siirrä alas"
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={refresh}
            title="Päivitä"
            aria-label="Päivitä"
          >
            ↻
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={onRemove}
            title="Poista pysäkki"
            aria-label="Poista pysäkki"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="stop-card__body">
        {error && (
          <p className="stop-card__error">
            Virhe: {error.message || String(error)}
          </p>
        )}
        {!error && departures.length === 0 && !loading && (
          <p className="stop-card__empty">Ei tulevia lähtöjä lähitunteina.</p>
        )}
        {departures.length > 0 && (
          <ul className="departures">
            {departures.map((d, i) => (
              <li key={`${d.tripId}-${i}`} className="departure">
                <span className={`route-badge route-${d.mode.toLowerCase()}`}>
                  {d.routeShortName || '?'}
                </span>
                <span className="departure__headsign">{d.headsign || d.routeLongName}</span>
                <span className="departure__times">
                  <span className="departure__rel">{formatRelative(d.time, now)}</span>
                  <span className="departure__clock">
                    {formatClock(d.time)}
                    {d.realtime && <span className="rt-dot" title="Reaaliaikainen" />}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="stop-card__footer">
        {loading && <span className="stop-card__loading">Päivitetään…</span>}
        {!loading && lastUpdated && (
          <span className="stop-card__updated">
            Päivitetty {formatClock(lastUpdated)}
          </span>
        )}
      </footer>
    </article>
  )
}
