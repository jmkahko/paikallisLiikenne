import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { getTripPattern } from '../api/digitransit.js'
import {
  OSM_TILE_URL,
  OSM_TILE_ATTRIBUTION,
  ICONS,
  ICONS_PASSED,
  SELECTED_ICON,
  ORIGIN_ICON,
  DEST_ICON,
  makeArrowIcon,
  makeVehicleIcon,
  modeClass
} from './mapShared.js'
import { computeTripProgress } from './tripProgress.js'

// Viivan värit vastaavat CSS-muuttujia --bus / --tram (Leaflet ei lue CSS-muuttujia).
const LINE_COLORS = { bus: '#2e86de', tram: '#e74c3c' }

const STATUS_TEXT = {
  before: 'Vuoro ei ole vielä lähtenyt lähtöpysäkiltä — näytetään suunniteltu reitti.',
  done: 'Vuoro on jo päättynyt.'
}

function formatClock(ms) {
  return new Date(ms).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}

// Ruutukulma kahden pisteen välille (➤ osoittaa oikealle, ruudun y alaspäin).
function bearing(a, b) {
  return (Math.atan2(-(b[0] - a[0]), b[1] - a[1]) * 180) / Math.PI
}

// Muutama suuntanuoli tasavälein reittiä pitkin (ajosuunta = geometrian järjestys).
function buildArrows(geometry) {
  if (geometry.length < 2) return []
  return [0.18, 0.42, 0.66, 0.9].map((f) => {
    const i = Math.min(geometry.length - 2, Math.floor(f * (geometry.length - 1)))
    return { pos: geometry[i], angle: bearing(geometry[i], geometry[i + 1]) }
  })
}

export default function TripMap({ tripId, stopId, routeShortName, headsign, mode, onClose }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    setData(null)
    getTripPattern(tripId)
      .then((res) => active && (setData(res), setLoading(false)))
      .catch((e) => active && (setError(e), setLoading(false)))
    return () => {
      active = false
    }
  }, [tripId])

  const cls = modeClass(mode)
  const color = LINE_COLORS[cls]
  const geometry = data?.geometry || []
  const stops = data?.stops || []
  const lastStop = stops.length - 1
  const progress = computeTripProgress(stops, geometry)
  const arrows = buildArrows(geometry)
  const vehEmoji = cls === 'tram' ? '🚊' : '🚌'

  function stopIcon(s, idx) {
    if (s.gtfsId === stopId) return SELECTED_ICON
    if (idx === 0) return ORIGIN_ICON
    if (idx === lastStop) return DEST_ICON
    return progress.passedIds.has(s.gtfsId) ? ICONS_PASSED[cls] : ICONS[cls]
  }
  function stopRole(s, idx) {
    if (s.gtfsId === stopId) return 'Pysäkkisi'
    if (idx === 0) return 'Lähtö'
    if (idx === lastStop) return 'Määränpää'
    return null
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--map" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="trip-map__title">
            <span className={`route-badge route-${cls}`}>{routeShortName || '?'}</span>
            <span className="trip-map__headsign">{headsign}</span>
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Sulje">
            ✕
          </button>
        </div>
        <div className="modal__content modal__content--map">
          {loading && <p className="trip-map__msg">Ladataan reittiä…</p>}
          {error && (
            <p className="trip-map__msg">
              Reitin lataus epäonnistui: {error.message || String(error)}
            </p>
          )}
          {!loading && !error && geometry.length === 0 && (
            <p className="trip-map__msg">Reittitietoa ei ole saatavilla tälle vuorolle.</p>
          )}
          {!loading && !error && geometry.length > 0 && (
            <>
              <div className="trip-map__legend">
                {progress.state === 'enroute' ? (
                  <>
                    <span className="trip-map__legend-item">
                      <span className="legend-veh">{vehEmoji}</span> Arvioitu sijainti
                    </span>
                    <span className="trip-map__legend-item">
                      <span className="legend-line" style={{ background: color }} /> Edessä
                    </span>
                    <span className="trip-map__legend-item">
                      <span className="legend-line legend-line--dashed" style={{ color }} /> Ajettu
                    </span>
                  </>
                ) : (
                  <span className="trip-map__legend-note">{STATUS_TEXT[progress.state]}</span>
                )}
              </div>
              <MapContainer
                bounds={geometry}
                boundsOptions={{ padding: [30, 30] }}
                className="trip-map"
                scrollWheelZoom
              >
                <TileLayer attribution={OSM_TILE_ATTRIBUTION} url={OSM_TILE_URL} />
                {progress.traveled.length > 1 && (
                  <Polyline
                    positions={progress.traveled}
                    pathOptions={{ color, weight: 4, opacity: 0.25, dashArray: '6 8' }}
                  />
                )}
                {progress.remaining.length > 1 && (
                  <Polyline
                    positions={progress.remaining}
                    pathOptions={{ color, weight: 5, opacity: 0.9 }}
                  />
                )}
                {progress.current.length > 1 && (
                  <Polyline
                    positions={progress.current}
                    pathOptions={{ color, weight: 8, opacity: 1 }}
                  />
                )}
                {arrows.map((a, i) => (
                  <Marker
                    key={`arrow-${i}`}
                    position={a.pos}
                    icon={makeArrowIcon(a.angle)}
                    interactive={false}
                  />
                ))}
                {progress.vehicle && (
                  <Marker position={progress.vehicle} icon={makeVehicleIcon(mode)}>
                    <Popup>
                      <div className="stop-popup">
                        <strong className="stop-popup__name">Vaunun arvioitu sijainti</strong>
                        {progress.fromStop && progress.fromStop.departure && (
                          <span className="stop-popup__code">
                            Lähtenyt pysäkiltä {progress.fromStop.name} klo{' '}
                            {formatClock(progress.fromStop.departure)}
                          </span>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}
                {stops.map((s, idx) => {
                  const role = stopRole(s, idx)
                  return (
                    <Marker key={s.gtfsId} position={[s.lat, s.lon]} icon={stopIcon(s, idx)}>
                      <Popup>
                        <div className="stop-popup">
                          <strong className="stop-popup__name">{s.name}</strong>
                          {s.code && <span className="stop-popup__code">#{s.code}</span>}
                          {role && <span className="stop-popup__you">{role}</span>}
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
