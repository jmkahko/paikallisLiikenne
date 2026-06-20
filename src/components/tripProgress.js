// Vuoron arvioitu eteneminen pysäkkien aikatauluajoista (ei GPS:ää).
// Käytetään TripMap-kartassa: mitkä pysäkit on jo ohitettu ja missä reitin
// välissä vaunu on juuri nyt.

// Lähin geometriapiste annettuun koordinaattiin (neliöetäisyys riittää).
export function nearestIndex(geometry, lat, lon) {
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < geometry.length; i++) {
    const dLat = geometry[i][0] - lat
    const dLon = geometry[i][1] - lon
    const d = dLat * dLat + dLon * dLon
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best
}

/**
 * @param {Array} stops - [{gtfsId, lat, lon, departure(ms|null)}], reittijärjestyksessä
 * @param {Array<[number,number]>} geometry
 * @param {number} now - epoch-ms
 * @returns {{
 *   state: 'before'|'enroute'|'done',
 *   passedIds: Set<string>,
 *   vehicle: [number,number]|null,
 *   traveled: Array, current: Array, remaining: Array
 * }}
 */
export function computeTripProgress(stops, geometry, now = Date.now()) {
  const result = {
    state: 'before',
    passedIds: new Set(),
    vehicle: null,
    fromStop: null,
    traveled: [],
    current: [],
    remaining: geometry
  }
  if (geometry.length < 2 || stops.length === 0) return result

  const hasTimes = stops.some((s) => typeof s.departure === 'number')
  if (!hasTimes) return result // ei reaaliaikatietoa → näytetään koko reitti

  let passed = 0
  for (const s of stops) {
    if (typeof s.departure === 'number' && s.departure < now) {
      passed++
      result.passedIds.add(s.gtfsId)
    }
  }

  if (passed === 0) return result // ei vielä lähtenyt (vaunu edellisellä vuorollaan)
  if (passed >= stops.length) {
    return { ...result, state: 'done', traveled: geometry, remaining: [] }
  }

  result.state = 'enroute'
  const last = stops[passed - 1]
  const next = stops[passed]

  const ia = nearestIndex(geometry, last.lat, last.lon)
  const ib = nearestIndex(geometry, next.lat, next.lon)
  const a = Math.min(ia, ib)
  const b = Math.max(ia, ib)
  result.traveled = geometry.slice(0, a + 1)
  result.current = geometry.slice(a, b + 1)
  result.remaining = geometry.slice(b)

  // Kuvake ei "liiku" pysäkkien välissä: sijoitetaan se nykyisen välin
  // keskelle ("tässä välissä menossa"), ei aikainterpolointia.
  const midIdx = Math.floor((a + b) / 2)
  result.vehicle = geometry[midIdx] || [(last.lat + next.lat) / 2, (last.lon + next.lon) / 2]
  result.fromStop = { name: last.name, departure: last.departure }
  return result
}
