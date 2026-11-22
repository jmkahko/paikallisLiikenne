// Jaettava linkki yksittäiseen vuoroon (issue #24):
//   /?trip=tampere:137_20322_17937290&date=2026-11-21&from=tampere:0001&to=tampere:8122
// Parametrit osoittavat index.html:ään, joten web-hotelliin ei tarvita
// uudelleenohjaussääntöjä. Linjan nimi ja määränpää haetaan rajapinnasta,
// ei linkistä — linkki pysyy lyhyenä eikä sen tekstiä voi väärentää.
import { formatClock } from './tripProgress.js'

const ID_RE = /^tampere:[\w.-]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const PARAMS = ['trip', 'date', 'from', 'to']

const isValid = (re, v) => typeof v === 'string' && re.test(v)

/**
 * @param {{tripId: string, date: string, fromId?: string|null, toId?: string|null}} link
 * @returns {string} absoluuttinen URL
 */
export function buildTripLink({ tripId, date, fromId, toId }) {
  // Kaksoispiste on sallittu query-osassa; jätetään se luettavaksi (%3A → :).
  const query = [tripId, date, fromId, toId]
    .map((v, i) => (v ? `${PARAMS[i]}=${encodeURIComponent(v).replace(/%3A/gi, ':')}` : null))
    .filter(Boolean)
    .join('&')
  return `${window.location.origin}${window.location.pathname}?${query}`
}

/**
 * Lue vuorolinkki osoiteriviltä. Virheelliset arvot hylätään ennen kuin niitä
 * lähetetään rajapintaan.
 * @returns {{tripId, date, fromId, toId}|null}
 */
export function parseTripLink(search = window.location.search) {
  const p = new URLSearchParams(search)
  const tripId = p.get('trip')
  const date = p.get('date')
  if (!isValid(ID_RE, tripId) || !isValid(DATE_RE, date)) return null
  const fromId = p.get('from')
  const toId = p.get('to')
  return {
    tripId,
    date,
    fromId: isValid(ID_RE, fromId) ? fromId : null,
    toId: isValid(ID_RE, toId) ? toId : null
  }
}

// Poista vuoroparametrit osoiteriviltä (modaalin sulkeminen), muut säilyvät.
export function clearTripLink() {
  const p = new URLSearchParams(window.location.search)
  PARAMS.forEach((k) => p.delete(k))
  const rest = p.toString()
  const { pathname, hash } = window.location
  window.history.replaceState(null, '', `${pathname}${rest ? `?${rest}` : ''}${hash}`)
}

/**
 * Viestiteksti jaettavaksi linkin kanssa, esim.
 * "Bussi 40C → Keskustori: lähtö Kangasalan asema th klo 17.27, perillä
 * Keskustori H arviolta klo 18.17"
 */
export function tripShareText({ routeShortName, headsign, mode, from, to }) {
  const vehicle = (mode || '').toUpperCase() === 'TRAM' ? 'Ratikka' : 'Bussi'
  const parts = []
  if (from?.departure) parts.push(`lähtö ${from.name} klo ${formatClock(from.departure)}`)
  if (to?.arrival) parts.push(`perillä ${to.name} arviolta klo ${formatClock(to.arrival)}`)
  const head = `${vehicle} ${routeShortName} → ${headsign}`
  return parts.length ? `${head}: ${parts.join(', ')}` : head
}

/**
 * Jaa linkki: ensin järjestelmän jakovalikko (puhelimet), sitten leikepöytä.
 * Kumpikin vaatii HTTPS:n tai localhostin — muuten palautetaan 'manual', ja
 * linkki näytetään käyttäjälle kopioitavaksi.
 * @returns {Promise<'shared'|'cancelled'|'copied'|'manual'>}
 */
export async function shareTripLink(url, text) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Paikallisliikenne', text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`)
    return 'copied'
  } catch {
    return 'manual'
  }
}
