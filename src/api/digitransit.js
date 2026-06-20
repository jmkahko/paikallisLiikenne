// Digitransit GraphQL API – Waltti (Tampere/Nysse)
//
// Selain ei kutsu Digitransitia suoraan, vaan oman palvelimen
// PHP-proxyn kautta (/api/digitransit.php). Avain pidetään palvelimella.
// Dev-tilassa Vite-server proxyttää saman polun suoraan Digitransitiin
// ja injektoi avaimen .env:n DIGITRANSIT_API_KEY-muuttujasta — avain ei
// mene selainbundleen myöskään devissä.

const ENDPOINT = '/api/digitransit.php'

async function gqlFetch(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })

  if (!res.ok) {
    let msg = res.statusText
    try {
      const errJson = await res.json()
      if (errJson?.errors?.length) {
        msg = errJson.errors.map((e) => e.message).join('; ')
      }
    } catch {
      const text = await res.text().catch(() => '')
      if (text) msg = text
    }
    throw new Error(`HTTP ${res.status}: ${msg}`)
  }

  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  return json.data
}

const STOP_SEARCH_QUERY = /* GraphQL */ `
  query StopSearch($name: String!) {
    stops(name: $name) {
      gtfsId
      name
      code
      desc
      vehicleMode
      lat
      lon
    }
  }
`

// Koodihaku: stops(name:) ei täsmää pysäkkikoodiin, joten numerokoodi
// haetaan suoraan id:llä (tampere:<koodi>). Tampereella code vastaa aina
// gtfsId:n loppuosaa.
const STOP_BY_ID_QUERY = /* GraphQL */ `
  query StopById($id: String!) {
    stop(id: $id) {
      gtfsId
      name
      code
      desc
      vehicleMode
      lat
      lon
    }
  }
`

const TAMPERE_FEED = 'tampere'
const MAX_SEARCH_RESULTS = 15

// Pysäkit kartan näkyvälle alueelle (bounding box). feeds-argumentti rajaa
// Tampereeseen jo palvelimella. Kentät vastaavat searchStops-tuloksen muotoa.
const STOPS_BY_BBOX_QUERY = /* GraphQL */ `
  query StopsByBbox(
    $minLat: Float!
    $minLon: Float!
    $maxLat: Float!
    $maxLon: Float!
  ) {
    stopsByBbox(
      minLat: $minLat
      minLon: $minLon
      maxLat: $maxLat
      maxLon: $maxLon
      feeds: ["${TAMPERE_FEED}"]
    ) {
      gtfsId
      name
      code
      vehicleMode
      lat
      lon
    }
  }
`

function isTampereStop(stop) {
  return !!stop && stop.gtfsId.startsWith(`${TAMPERE_FEED}:`)
}

// Vuoron (trip) reittigeometria ja pysäkit kartalle (issue #9). geometry
// palautuu valmiina lat/lon-taulukkona, joten polyline-dekoodausta ei tarvita.
// stoptimesForDate antaa pysäkkikohtaiset (reaaliaika)ajat → vuoron arvioitu
// eteneminen (mitkä pysäkit ohitettu, missä välissä vaunu on nyt).
const TRIP_PATTERN_QUERY = /* GraphQL */ `
  query TripPattern($id: String!) {
    trip(id: $id) {
      gtfsId
      pattern {
        geometry {
          lat
          lon
        }
        stops {
          gtfsId
          name
          code
          lat
          lon
        }
      }
      stoptimesForDate {
        realtime
        realtimeDeparture
        serviceDay
        stop {
          gtfsId
        }
      }
    }
  }
`

const STOP_DEPARTURES_QUERY = /* GraphQL */ `
  query StopDepartures($id: String!, $n: Int!) {
    stop(id: $id) {
      gtfsId
      name
      code
      vehicleMode
      lat
      lon
      stoptimesWithoutPatterns(numberOfDepartures: $n, omitNonPickups: true) {
        scheduledDeparture
        realtimeDeparture
        serviceDay
        realtime
        realtimeState
        headsign
        trip {
          gtfsId
          route {
            shortName
            longName
            mode
          }
        }
      }
    }
  }
`

// Häiriötiedotteet rajataan Tampereen feediin palvelinpuolella. Tiedotteet
// kytkeytyvät pysäkkeihin (entities) — Tampereella route on yleensä tyhjä.
const ALERTS_QUERY = /* GraphQL */ `
  query Alerts {
    alerts(feeds: ["${TAMPERE_FEED}"]) {
      id
      alertSeverityLevel
      alertEffect
      effectiveStartDate
      effectiveEndDate
      alertHeaderText(language: "fi")
      alertDescriptionText(language: "fi")
      alertUrl(language: "fi")
      route { shortName }
      stop { gtfsId }
      entities {
        __typename
        ... on Stop { gtfsId name }
        ... on Route { shortName }
      }
    }
  }
`

function normalizeAlert(a) {
  const stopIds = new Set()
  const routeNames = new Set()
  if (a.stop?.gtfsId) stopIds.add(a.stop.gtfsId)
  if (a.route?.shortName) routeNames.add(a.route.shortName)
  for (const e of a.entities || []) {
    if (e.__typename === 'Stop' && e.gtfsId) stopIds.add(e.gtfsId)
    if (e.__typename === 'Route' && e.shortName) routeNames.add(e.shortName)
  }
  return {
    id: a.id,
    severity: a.alertSeverityLevel || 'UNKNOWN_SEVERITY',
    effect: a.alertEffect || null,
    header: a.alertHeaderText || '',
    description: a.alertDescriptionText || '',
    url: a.alertUrl || null,
    start: a.effectiveStartDate ? new Date(a.effectiveStartDate * 1000) : null,
    end: a.effectiveEndDate ? new Date(a.effectiveEndDate * 1000) : null,
    stopIds: [...stopIds],
    routeNames: [...routeNames]
  }
}

/**
 * Etsi pysäkkejä nimen tai koodin perusteella. Palauttaa vain Tampereen
 * pysäkit (rajapinta kattaa koko Waltti-alueen, monta kaupunkia).
 * @param {string} term - hakusana (esim. "Keskustori" tai "0001")
 * @returns {Promise<Array>}
 */
export async function searchStops(term) {
  const trimmed = term.trim()
  if (!trimmed) return []

  // Pelkkä numerosarja tulkitaan pysäkkikoodiksi → suora id-haku.
  if (/^\d+$/.test(trimmed)) {
    const data = await gqlFetch(STOP_BY_ID_QUERY, {
      id: `${TAMPERE_FEED}:${trimmed}`
    })
    return isTampereStop(data?.stop) ? [data.stop] : []
  }

  // Nimihaku: suodatetaan Tampere ENNEN tulosten rajaamista, jotta muiden
  // kaupunkien pysäkit eivät syö 15 tuloksen kiintiötä.
  const data = await gqlFetch(STOP_SEARCH_QUERY, { name: trimmed })
  return (data.stops || []).filter(isTampereStop).slice(0, MAX_SEARCH_RESULTS)
}

/**
 * Hae pysäkit kartan näkyvälle alueelle (bounding box). Käytetään
 * kartalta-valinnassa (StopMap). Rajaus Tampereeseen tehdään palvelinpuolella
 * feeds-argumentilla, joten erillistä suodatusta ei tarvita.
 * @param {{minLat:number, minLon:number, maxLat:number, maxLon:number}} bbox
 * @returns {Promise<Array>} pysäkit (gtfsId, name, code, vehicleMode, lat, lon)
 */
export async function getStopsByBbox({ minLat, minLon, maxLat, maxLon }) {
  const data = await gqlFetch(STOPS_BY_BBOX_QUERY, {
    minLat,
    minLon,
    maxLat,
    maxLon
  })
  return (data?.stopsByBbox || []).filter(
    (s) => s && typeof s.lat === 'number' && typeof s.lon === 'number'
  )
}

/**
 * Hae vuoron (trip) reittigeometria ja reitin pysäkit kartalle näytettäväksi
 * (issue #9). Geometria palautuu lat/lon-taulukkona valmiina Leaflet-polylineksi.
 * @param {string} tripId - vuoron gtfsId (esim. "tampere:121_19227_16714756")
 * @returns {Promise<{geometry: Array<[number, number]>, stops: Array}|null>}
 */
export async function getTripPattern(tripId) {
  const data = await gqlFetch(TRIP_PATTERN_QUERY, { id: tripId })
  const trip = data?.trip
  const pattern = trip?.pattern
  if (!pattern) return null

  const geometry = (pattern.geometry || [])
    .filter((p) => p && typeof p.lat === 'number' && typeof p.lon === 'number')
    .map((p) => [p.lat, p.lon])

  // Yhdistä pysäkin koordinaatit ja reaaliaika-lähtöaika. stoptimesForDate on
  // samassa järjestyksessä kuin pattern.stops, joten zipataan indeksillä
  // (kestää myös toistuvat gtfsId:t reitillä). departure on epoch-ms tai null.
  const times = trip.stoptimesForDate || []
  const stops = (pattern.stops || [])
    .map((s, i) => {
      const t = times[i]
      const valid =
        t && typeof t.serviceDay === 'number' && typeof t.realtimeDeparture === 'number'
      return {
        gtfsId: s.gtfsId,
        name: s.name,
        code: s.code,
        lat: s.lat,
        lon: s.lon,
        departure: valid ? (t.serviceDay + t.realtimeDeparture) * 1000 : null,
        realtime: t ? !!t.realtime : false
      }
    })
    .filter((s) => typeof s.lat === 'number' && typeof s.lon === 'number')

  return { geometry, stops }
}

/**
 * Hae pysäkin seuraavat lähdöt.
 * @param {string} stopId - GTFS-pysäkin id (esim. "tampere:0501")
 * @param {number} numberOfDepartures
 * @returns {Promise<{stop: object, departures: Array}|null>}
 */
export async function getStopDepartures(stopId, numberOfDepartures = 5) {
  const data = await gqlFetch(STOP_DEPARTURES_QUERY, {
    id: stopId,
    n: numberOfDepartures
  })
  if (!data?.stop) return null

  const departures = (data.stop.stoptimesWithoutPatterns || []).map((st) => {
    const secs = st.realtimeDeparture ?? st.scheduledDeparture
    const epoch = (st.serviceDay + secs) * 1000 // ms
    return {
      time: new Date(epoch),
      realtime: !!st.realtime,
      headsign: st.headsign,
      routeShortName: st.trip?.route?.shortName ?? '',
      routeLongName: st.trip?.route?.longName ?? '',
      mode: st.trip?.route?.mode ?? data.stop.vehicleMode ?? 'BUS',
      tripId: st.trip?.gtfsId
    }
  })

  return {
    stop: {
      gtfsId: data.stop.gtfsId,
      name: data.stop.name,
      code: data.stop.code,
      vehicleMode: data.stop.vehicleMode,
      lat: data.stop.lat,
      lon: data.stop.lon
    },
    departures
  }
}

/**
 * Hae Tampereen häiriötiedotteet (kaikki).
 * @returns {Promise<Array>} normalisoidut tiedotteet
 */
export async function getAlerts() {
  const data = await gqlFetch(ALERTS_QUERY)
  return (data.alerts || []).map(normalizeAlert)
}

/**
 * Hae valittujen pysäkkien reittien lyhytnimet. Tarvitaan reittikohdistettujen
 * häiriötiedotteiden (esim. "raitiovaunu 1") yhdistämiseen pysäkkiin — tiedote
 * voi koskea reittiä ilman yhtään Stop-entityä. Kaikki pysäkit haetaan yhdellä
 * aliasoidulla kyselyllä, joten verkossa käydään vain kerran.
 * @param {string[]} stopIds - GTFS-pysäkkien id:t (esim. ["tampere:0001"])
 * @returns {Promise<Object>} map gtfsId → reittien shortName-taulukko
 */
export async function getStopRoutes(stopIds) {
  const ids = [...new Set(stopIds)].filter(Boolean)
  if (ids.length === 0) return {}

  const varDefs = ids.map((_, i) => `$id${i}: String!`).join(', ')
  const fields = ids
    .map((_, i) => `s${i}: stop(id: $id${i}) { gtfsId routes { shortName } }`)
    .join('\n    ')
  const query = `query StopRoutes(${varDefs}) {\n    ${fields}\n  }`
  const variables = Object.fromEntries(ids.map((id, i) => [`id${i}`, id]))

  const data = await gqlFetch(query, variables)
  const result = {}
  for (const key of Object.keys(data || {})) {
    const stop = data[key]
    if (!stop?.gtfsId) continue
    result[stop.gtfsId] = (stop.routes || [])
      .map((r) => r.shortName)
      .filter(Boolean)
  }
  return result
}
