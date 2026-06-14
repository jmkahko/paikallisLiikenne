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

function isTampereStop(stop) {
  return !!stop && stop.gtfsId.startsWith(`${TAMPERE_FEED}:`)
}

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
