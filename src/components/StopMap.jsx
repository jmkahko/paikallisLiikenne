import { useCallback, useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getStopsByBbox } from '../api/digitransit.js'

// Tampereen keskusta (Keskustori). Kartta avautuu tähän.
const TAMPERE_CENTER = [61.4978, 23.761]
const DEFAULT_ZOOM = 14
// Alle tämän zoomin pysäkkejä ei haeta — alue olisi liian iso (liikaa
// tuloksia + OSM-laattojen reilu käyttö). Käyttäjälle näytetään vihje.
const MIN_FETCH_ZOOM = 13
const FETCH_DEBOUNCE_MS = 400

function modeClass(mode) {
  return (mode || 'BUS').toLowerCase() === 'tram' ? 'tram' : 'bus'
}

// Markkeri-ikonit luodaan kerran (ei kuvatiedostoja → vältetään Leaflet/Vite-
// ikonibugin assetpolut). Väritys hoidetaan CSS:llä mode-luokan kautta.
function makeIcon(cls) {
  return L.divIcon({
    className: 'stop-marker-wrap',
    html: `<span class="stop-marker stop-marker--${cls}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  })
}
const ICONS = { bus: makeIcon('bus'), tram: makeIcon('tram') }

// Karttatason sisäkomponentti: kuuntelee kartan liikkeitä ja hakee pysäkit
// näkyvälle alueelle. Pitää oltava MapContainerin sisällä (käyttää karttaa).
function StopsLayer({ onSelect, selectedStopIds, isFull, onTooFarChange }) {
  const [stops, setStops] = useState([])
  const timerRef = useRef(null)

  const load = useCallback(
    (map) => {
      if (map.getZoom() < MIN_FETCH_ZOOM) {
        setStops([])
        onTooFarChange(true)
        return
      }
      onTooFarChange(false)
      const b = map.getBounds()
      getStopsByBbox({
        minLat: b.getSouth(),
        minLon: b.getWest(),
        maxLat: b.getNorth(),
        maxLon: b.getEast()
      })
        .then(setStops)
        .catch(() => setStops([]))
    },
    [onTooFarChange]
  )

  const map = useMapEvents({
    moveend: () => schedule(),
    zoomend: () => schedule()
  })

  function schedule() {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => load(map), FETCH_DEBOUNCE_MS)
  }

  useEffect(() => {
    load(map)
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return stops.map((s) => {
    const added = selectedStopIds.has(s.gtfsId)
    const disabled = added || isFull
    return (
      <Marker key={s.gtfsId} position={[s.lat, s.lon]} icon={ICONS[modeClass(s.vehicleMode)]}>
        <Popup>
          <div className="stop-popup">
            <strong className="stop-popup__name">{s.name}</strong>
            {s.code && <span className="stop-popup__code">#{s.code}</span>}
            <button
              type="button"
              className="stop-popup__add"
              disabled={disabled}
              onClick={() => {
                onSelect(s)
                map.closePopup()
              }}
            >
              {added ? 'Jo lisätty' : isFull ? 'Lista täynnä' : 'Lisää pysäkki'}
            </button>
          </div>
        </Popup>
      </Marker>
    )
  })
}

export default function StopMap({ onSelect, selectedStopIds, isFull }) {
  const [tooFar, setTooFar] = useState(false)

  return (
    <div className="stop-map-panel">
      {tooFar && (
        <p className="stop-map__hint">Zoomaa lähemmäs nähdäksesi pysäkit.</p>
      )}
      <MapContainer
        center={TAMPERE_CENTER}
        zoom={DEFAULT_ZOOM}
        className="stop-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> -tekijät'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <StopsLayer
          onSelect={onSelect}
          selectedStopIds={selectedStopIds}
          isFull={isFull}
          onTooFarChange={setTooFar}
        />
      </MapContainer>
    </div>
  )
}
