import { useState } from 'react'
import { useTrip } from '../hooks/useTrip.js'
import TripMap from './TripMap.jsx'
import TripTimetable from './TripTimetable.jsx'
import TripShare from './TripShare.jsx'
import { modeClass } from './mapShared.js'
import { computeTripProgress, findLegIndexes, formatClock } from './tripProgress.js'
import { buildTripLink, tripShareText } from './tripLink.js'

/**
 * Yksittäisen vuoron näkymä (issuet #9 ja #24): yhteenveto (lähtö / perillä),
 * Jaa-painike sekä välilehdet "Kartta" ja "Aikataulu". Avataan pysäkkikortin
 * aikataulurivistä tai jaetusta linkistä (App.jsx). Linjan nimi, määränpää ja
 * kulkuneuvo otetaan haetusta vuorosta; propsit näkyvät vain latauksen ajan.
 *
 * @param {{tripId, date, fromId, toId, routeShortName, headsign, mode, onClose}} props
 */
export default function TripModal({
  tripId,
  date,
  fromId = null,
  toId: initialToId = null,
  routeShortName,
  headsign,
  mode,
  onClose
}) {
  const { data, error, loaded } = useTrip(tripId, date)
  const [toId, setToId] = useState(initialToId)
  const [tab, setTab] = useState('map') // 'map' | 'timetable'

  const now = Date.now()
  const stops = data?.stops || []
  const geometry = data?.geometry || []
  const progress = computeTripProgress(stops, geometry, now)
  const { fromIdx, toIdx } = findLegIndexes(stops, fromId, toId)
  const fromStop = fromIdx >= 0 ? stops[fromIdx] : null
  const endStop = toIdx >= 0 ? stops[toIdx] : stops[stops.length - 1] || null

  const route = data?.routeShortName || routeShortName || '?'
  const title = data?.headsign || headsign || 'Vuoro'
  const tripMode = data?.mode || mode
  const cls = modeClass(tripMode)

  const link = buildTripLink({
    tripId,
    date,
    fromId: fromStop ? fromId : null,
    toId: toIdx >= 0 ? toId : null
  })
  const shareText = tripShareText({
    routeShortName: route,
    headsign: title,
    mode: tripMode,
    from: fromStop,
    to: toIdx >= 0 ? endStop : null
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--map" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="trip-map__title">
            <span className={`route-badge route-${cls}`}>{route}</span>
            <span className="trip-map__headsign">{title}</span>
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Sulje">
            ✕
          </button>
        </div>
        <div className="modal__content modal__content--map">
          {!loaded && <p className="trip-map__msg">Ladataan reittiä…</p>}
          {loaded && !data && (
            <p className="trip-map__msg">
              {error
                ? `Reitin lataus epäonnistui: ${error.message || String(error)}`
                : 'Vuoroa ei löytynyt tälle päivälle. Linkki voi olla vanhentunut.'}
            </p>
          )}
          {data && (
            <>
              <div className="trip-summary">
                <div className="trip-summary__times">
                  {fromStop?.departure && (
                    <span>
                      Lähtö <strong>{fromStop.name}</strong> klo {formatClock(fromStop.departure)}
                    </span>
                  )}
                  {endStop?.arrival && (
                    <span>
                      {toIdx >= 0 ? 'Perillä' : 'Päätepysäkillä'} <strong>{endStop.name}</strong>{' '}
                      klo {formatClock(endStop.arrival)}
                    </span>
                  )}
                </div>
                <TripShare url={link} text={shareText} />
              </div>
              <div className="controls__tabs trip-modal__tabs" role="tablist" aria-label="Vuoron näkymä">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'map'}
                  className={`controls__tab${tab === 'map' ? ' controls__tab--active' : ''}`}
                  onClick={() => setTab('map')}
                >
                  <span aria-hidden="true">🗺️</span> Kartta
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'timetable'}
                  className={`controls__tab${tab === 'timetable' ? ' controls__tab--active' : ''}`}
                  onClick={() => setTab('timetable')}
                >
                  <span aria-hidden="true">🕒</span> Aikataulu
                </button>
              </div>
              {tab === 'map' ? (
                <TripMap
                  geometry={geometry}
                  stops={stops}
                  progress={progress}
                  mode={tripMode}
                  fromIdx={fromIdx}
                  toIdx={toIdx}
                />
              ) : (
                <TripTimetable
                  stops={stops}
                  now={now}
                  fromIdx={fromIdx}
                  toIdx={toIdx}
                  onSelectTo={setToId}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
