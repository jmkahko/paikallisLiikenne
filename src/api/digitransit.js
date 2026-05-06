// Digitransit GraphQL API – Waltti (Tampere/Nysse)
// Dokumentaatio: https://digitransit.fi/en/developers/apis/1-routing-api/

const ENDPOINT =
  'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/'

function getApiKey() {
  const key = import.meta.env.VITE_DIGITRANSIT_API_KEY
  if (!key) {
    throw new Error(
      'Digitransit API -avain puuttuu. Luo .env-tiedosto ja aseta VITE_DIGITRANSIT_API_KEY.'
    )
  }
  return key
}

async function gqlFetch(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'digitransit-subscription-key': getApiKey()
    },
    body: JSON.stringify({ query, variables })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
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

const MAX_SEARCH_RESULTS = 15

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

/**
 * Etsi pysäkkejä nimen tai koodin perusteella.
 * @param {string} term - hakusana (esim. "Keskustori" tai "0501")
 * @returns {Promise<Array>}
 */
export async function searchStops(term) {
  const trimmed = term.trim()
  if (!trimmed) return []
  const data = await gqlFetch(STOP_SEARCH_QUERY, { name: trimmed })
  return (data.stops || []).slice(0, MAX_SEARCH_RESULTS)
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
