import L from 'leaflet'

// Jaetut karttatyökalut StopMap- ja TripMap-komponenteille.
// OpenStreetMapin julkiset laatat (ei API-avainta) — attribuutio pakollinen.
export const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const OSM_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> -tekijät'

export function modeClass(mode) {
  return (mode || 'BUS').toLowerCase() === 'tram' ? 'tram' : 'bus'
}

// Markkeri-ikonit luodaan kerran (ei kuvatiedostoja → vältetään Leaflet/Vite-
// ikonibugin assetpolut). Väritys hoidetaan CSS:llä mode-luokan kautta.
function makeStopIcon(cls, extra = '') {
  return L.divIcon({
    className: 'stop-marker-wrap',
    html: `<span class="stop-marker stop-marker--${cls}${extra}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8]
  })
}

export const ICONS = {
  bus: makeStopIcon('bus'),
  tram: makeStopIcon('tram')
}

// Himmennetty ikoni jo ohitetulle pysäkille (reittikartta).
export const ICONS_PASSED = {
  bus: makeStopIcon('bus', ' stop-marker--passed'),
  tram: makeStopIcon('tram', ' stop-marker--passed')
}

// Vaunun arvioitu sijainti reitillä.
export function makeVehicleIcon(mode) {
  const emoji = (mode || 'BUS').toLowerCase() === 'tram' ? '🚊' : '🚌'
  return L.divIcon({
    className: 'vehicle-marker-wrap',
    html: `<span class="vehicle-marker">${emoji}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -18]
  })
}

// Korostettu ikoni valitulle pysäkille (esim. käyttäjän pysäkki reitillä).
export const SELECTED_ICON = L.divIcon({
  className: 'stop-marker-wrap',
  html: '<span class="stop-marker stop-marker--selected"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
})

// Reitin päätepisteet: lähtöpysäkki (ontto) ja määränpää (tumma neliö).
export const ORIGIN_ICON = L.divIcon({
  className: 'stop-marker-wrap',
  html: '<span class="stop-marker stop-marker--origin"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -8]
})

export const DEST_ICON = L.divIcon({
  className: 'stop-marker-wrap',
  html: '<span class="stop-marker stop-marker--dest"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9]
})

// Suuntanuoli reittiviivalle (kulma asteina, ➤ osoittaa oletuksena oikealle).
export function makeArrowIcon(angle) {
  return L.divIcon({
    className: 'dir-arrow-wrap',
    html: `<span class="dir-arrow" style="transform: rotate(${angle}deg)">➤</span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })
}
