import { useEffect, useState } from 'react'
import { useDepartures } from '../hooks/useDepartures.js'
import TripModal from './TripModal.jsx'
import { useLanguage, useText } from '../i18n/texts.jsx'

// Kulkumuodot, joille on teksti tietokannassa (common.mode.*).
const MODES = ['bus', 'tram', 'rail', 'ferry', 'subway']

function formatRelative(date, now, t) {
  const diffMs = date.getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes <= 0) return t('stopCard.now')
  if (minutes < 60) return t('stopCard.minutes', [minutes])
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? t('stopCard.hours', [h]) : t('stopCard.hoursMinutes', [h, m])
}

function formatClock(date, locale) {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

export default function StopCard({ stop, departureCount = 5, onRemove, onMove, isFirst, isLast }) {
  const t = useText()
  const { locale } = useLanguage()
  const { data, error, loading, lastUpdated, refresh } = useDepartures(
    stop.gtfsId,
    30_000,
    departureCount
  )
  const [now, setNow] = useState(() => new Date())
  const [activeTrip, setActiveTrip] = useState(null)

  // Päivitä "min"-laskuri sekunnin välein, jotta luvut juoksevat sujuvasti.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const departures = data?.departures ?? []
  const mode = (data?.stop?.vehicleMode || stop.vehicleMode || 'BUS').toUpperCase()
  const modeKey = mode.toLowerCase()

  return (
    <>
    <article className={`stop-card stop-card--${mode.toLowerCase()}`}>
      <header className="stop-card__header">
        <div className="stop-card__title">
          <span className={`mode-dot mode-${mode.toLowerCase()}`} aria-hidden="true" />
          <div>
            <h2 className="stop-card__name">{stop.name}</h2>
            <p className="stop-card__meta">
              {stop.code && <span>#{stop.code}</span>}
              <span>{MODES.includes(modeKey) ? t(`common.mode.${modeKey}`) : mode}</span>
            </p>
          </div>
        </div>
        <div className="stop-card__actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            title={t('stopCard.moveUp')}
            aria-label={t('stopCard.moveUp')}
          >
            ↑
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onMove(1)}
            disabled={isLast}
            title={t('stopCard.moveDown')}
            aria-label={t('stopCard.moveDown')}
          >
            ↓
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={refresh}
            title={t('stopCard.refresh')}
            aria-label={t('stopCard.refresh')}
          >
            ↻
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={onRemove}
            title={t('stopCard.remove')}
            aria-label={t('stopCard.remove')}
          >
            ✕
          </button>
        </div>
      </header>

      <div className="stop-card__body">
        {error && (
          <p className="stop-card__error">
            {t('common.error', [error.message || String(error)])}
          </p>
        )}
        {!error && departures.length === 0 && !loading && (
          <p className="stop-card__empty">{t('stopCard.empty')}</p>
        )}
        {departures.length > 0 && (
          <ul className="departures">
            {departures.map((d, i) => {
              const headsign = d.headsign || d.routeLongName
              const inner = (
                <>
                  <span className={`route-badge route-${d.mode.toLowerCase()}`}>
                    {d.routeShortName || '?'}
                  </span>
                  <span className="departure__headsign">{headsign}</span>
                  <span className="departure__times">
                    <span className="departure__rel">{formatRelative(d.time, now, t)}</span>
                    <span className="departure__clock">
                      {formatClock(d.time, locale)}
                      {d.realtime && <span className="rt-dot" title={t('common.realtime')} />}
                    </span>
                  </span>
                </>
              )
              return (
                <li key={`${d.tripId}-${i}`} className="departure-row">
                  {d.tripId ? (
                    <button
                      type="button"
                      className="departure departure--clickable"
                      onClick={() =>
                        setActiveTrip({
                          tripId: d.tripId,
                          date: d.serviceDate,
                          routeShortName: d.routeShortName,
                          headsign,
                          mode: d.mode
                        })
                      }
                      title={t('stopCard.showTrip')}
                    >
                      {inner}
                    </button>
                  ) : (
                    <div className="departure">{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="stop-card__footer">
        {loading && <span className="stop-card__loading">{t('stopCard.updating')}</span>}
        {!loading && lastUpdated && (
          <span className="stop-card__updated">
            {t('stopCard.updated', [formatClock(lastUpdated, locale)])}
          </span>
        )}
      </footer>
    </article>
    {activeTrip && (
      <TripModal
        tripId={activeTrip.tripId}
        date={activeTrip.date}
        fromId={stop.gtfsId}
        routeShortName={activeTrip.routeShortName}
        headsign={activeTrip.headsign}
        mode={activeTrip.mode}
        onClose={() => setActiveTrip(null)}
      />
    )}
    </>
  )
}
