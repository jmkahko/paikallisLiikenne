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

// Vuoron (trip) reittigeometria, pysäkit ja pysäkkikohtaiset ajat tiettynä
// palvelupäivänä (issuet #9 ja #24). Sama trip-id ajetaan joka päivä, joten
// päivä on pakollinen — muuten jaettu linkki näyttäisi seuraavan päivän vuoron.
// onServiceDate korvaa vanhentuneen stoptimesForDate-kentän ja antaa ajat
// ISO-aikaleimoina (aikataulu + reaaliaika). geometry palautuu valmiina
// lat/lon-taulukkona, joten polyline-dekoodausta ei tarvita.
const TRIP_QUERY = /* GraphQL */ `
  query Trip($id: String!, $date: LocalDate!) {
    trip(id: $id) {
      gtfsId
      tripHeadsign
      route {
        shortName
        longName
        mode
      }
      pattern {
        geometry {
          lat
          lon
        }
      }
      onServiceDate(date: $date) {
        stopCalls {
          stopLocation {
            ... on Stop {
              gtfsId
              name
              code
              lat
              lon
            }
          }
          schedule {
            time {
              ... on ArrivalDepartureTime {
                arrival
                departure
              }
            }
          }
          realTime {
            arrival { time }
            departure { time }
          }
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
  query Alerts($lang: String) {
    alerts(feeds: ["${TAMPERE_FEED}"]) {
      id
      alertSeverityLevel
      alertEffect
      effectiveStartDate
      effectiveEndDate
      alertHeaderText(language: $lang)
      alertDescriptionText(language: $lang)
      alertUrl(language: $lang)
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

// ISO-aikaleima → epoch-ms (null jos puuttuu tai ei jäsenny).
function isoToMs(iso) {
  const ms = iso ? Date.parse(iso) : NaN
  return Number.isNaN(ms) ? null : ms
}

/**
 * Palvelupäivä (YYYY-MM-DD) stoptimen serviceDay-kentästä. serviceDay on
 * "keskipäivä − 12 h" paikallista aikaa, joten kesäaikasiirtymäpäivinä se
 * osuu edellisen päivän puolelle — lisätään 12 h ennen muotoilua. Myös
 * keskiyön yli ajavat vuorot saavat näin oikean (edellisen) päivän.
 * @param {number} serviceDay - epoch-sekunnit
 * @returns {string}
 */
export function toServiceDate(serviceDay) {
  return new Date((serviceDay + 12 * 3600) * 1000).toLocaleDateString('sv-SE', {
    timeZone: 'Europe/Helsinki'
  })
}

/**
 * Hae vuoron (trip) reittigeometria, linjatiedot ja pysäkit aikoineen annettuna
 * palvelupäivänä (issuet #9 ja #24). Geometria palautuu lat/lon-taulukkona
 * valmiina Leaflet-polylineksi.
 * @param {string} tripId - vuoron gtfsId (esim. "tampere:121_19227_16714756")
 * @param {string} date - palvelupäivä muodossa YYYY-MM-DD
 * @returns {Promise<{routeShortName, routeLongName, mode, headsign,
 *   geometry: Array<[number, number]>, stops: Array}|null>} null, jos vuoroa
 *   ei löydy tai se ei liikennöi kyseisenä päivänä
 */
export async function getTrip(tripId, date) {
  const data = await gqlFetch(TRIP_QUERY, { id: tripId, date })
  const trip = data?.trip
  const calls = trip?.onServiceDate?.stopCalls
  if (!calls) return null

  const geometry = (trip.pattern?.geometry || [])
    .filter((p) => p && typeof p.lat === 'number' && typeof p.lon === 'number')
    .map((p) => [p.lat, p.lon])

  // Ajat epoch-ms:inä. arrival/departure = reaaliaika jos saatavilla, muuten
  // aikataulu; scheduled* = aikataulu (viiveen laskemiseen).
  const stops = calls
    .map((c) => {
      const s = c.stopLocation || {}
      const sched = c.schedule?.time || {}
      const rt = c.realTime
      const scheduledArrival = isoToMs(sched.arrival)
      const scheduledDeparture = isoToMs(sched.departure)
      return {
        gtfsId: s.gtfsId,
        name: s.name,
        code: s.code,
        lat: s.lat,
        lon: s.lon,
        scheduledArrival,
        scheduledDeparture,
        arrival: isoToMs(rt?.arrival?.time) ?? scheduledArrival,
        departure: isoToMs(rt?.departure?.time) ?? scheduledDeparture,
        realtime: !!rt
      }
    })
    .filter((s) => s.gtfsId && typeof s.lat === 'number' && typeof s.lon === 'number')

  return {
    routeShortName: trip.route?.shortName ?? '',
    routeLongName: trip.route?.longName ?? '',
    mode: trip.route?.mode ?? 'BUS',
    headsign: trip.tripHeadsign || trip.route?.longName || '',
    geometry,
    stops
  }
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
      tripId: st.trip?.gtfsId,
      serviceDate: toServiceDate(st.serviceDay)
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
 * Hae Tampereen häiriötiedotteet (kaikki) käyttöliittymän kielellä. Jos
 * tiedotteelle ei ole käännöstä, Digitransit palauttaa sen suomeksi.
 * @param {string} lang - esim. 'fi', 'en'
 * @returns {Promise<Array>} normalisoidut tiedotteet
 */
export async function getAlerts(lang = 'fi') {
  const data = await gqlFetch(ALERTS_QUERY, { lang })
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
