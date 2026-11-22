import { formatClock } from './tripProgress.js'

// Poikkeama aikataulusta minuutteina ("+2 min" / "−1 min"), null jos ajallaan.
function delayText(actual, scheduled) {
  if (actual == null || scheduled == null) return null
  const min = Math.round((actual - scheduled) / 60000)
  if (min === 0) return null
  return min > 0 ? `+${min} min` : `−${-min} min`
}

/**
 * Vuoron pysäkit aikoineen (issue #24). Pysäkkiä napauttamalla valitaan
 * jääpoispysäkki, joka tulee mukaan jaettavaan linkkiin. Nousupysäkiltä
 * näytetään lähtöaika, muilta saapumisaika.
 */
export default function TripTimetable({ stops, now, fromIdx, toIdx, onSelectTo }) {
  return (
    <div className="trip-timetable">
      <p className="trip-timetable__hint">
        Valitse pysäkki, jolla jäät pois — saapumisaika näkyy yllä ja pysäkki tulee
        mukaan jaettavaan linkkiin.
      </p>
      <ol className="trip-timetable__list">
        {stops.map((s, idx) => {
          const isFrom = idx === fromIdx
          const isTo = idx === toIdx
          const time = isFrom ? s.departure : s.arrival ?? s.departure
          const sched = isFrom ? s.scheduledDeparture : s.scheduledArrival ?? s.scheduledDeparture
          const delay = s.realtime ? delayText(time, sched) : null
          const passed = typeof s.departure === 'number' && s.departure < now
          const selectable = idx > fromIdx
          const cls = [
            'trip-stop',
            passed && 'trip-stop--passed',
            (isFrom || isTo) && 'trip-stop--leg'
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={`${s.gtfsId}-${idx}`} className={cls}>
              <button
                type="button"
                className="trip-stop__btn"
                disabled={!selectable}
                aria-pressed={isTo}
                onClick={() => onSelectTo(isTo ? null : s.gtfsId)}
                title={isTo ? 'Poista valinta' : selectable ? 'Jään pois tällä pysäkillä' : undefined}
              >
                <span className="trip-stop__time">
                  {time ? formatClock(time) : '–'}
                  {s.realtime && <span className="rt-dot" title="Reaaliaikainen" />}
                </span>
                <span className="trip-stop__name">
                  {s.name}
                  {s.code && <span className="trip-stop__code">#{s.code}</span>}
                </span>
                {delay && <span className="trip-stop__delay">{delay}</span>}
                {isFrom && <span className="trip-stop__role">Nousu</span>}
                {isTo && <span className="trip-stop__role">Pois</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
