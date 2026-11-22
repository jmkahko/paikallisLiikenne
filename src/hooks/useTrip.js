import { useEffect, useRef, useState, useCallback } from 'react'
import { getTrip } from '../api/digitransit.js'

/**
 * Hakee vuoron reitin ja pysäkkiajat annettuna palvelupäivänä ja päivittää
 * annetulla intervallilla, jotta arvioitu sijainti ja reaaliaika-ajat pysyvät
 * ajan tasalla (esim. jaetussa "olen nyt ratikassa" -linkissä). Polling
 * pysäytetään kun välilehti ei ole näkyvissä (Page Visibility API).
 *
 * data on null, jos vuoroa ei löydy tai se ei liikennöi kyseisenä päivänä;
 * loaded kertoo, onko ensimmäinen haku valmis.
 *
 * @param {string} tripId
 * @param {string} date - palvelupäivä YYYY-MM-DD
 * @param {number} intervalMs
 */
export function useTrip(tripId, date, intervalMs = 30_000) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)

  const fetchNow = useCallback(async () => {
    if (!tripId || !date) return
    try {
      const result = await getTrip(tripId, date)
      if (cancelledRef.current) return
      setData(result)
      setError(null)
    } catch (e) {
      if (cancelledRef.current) return
      setError(e)
    } finally {
      if (!cancelledRef.current) setLoaded(true)
    }
  }, [tripId, date])

  useEffect(() => {
    cancelledRef.current = false
    setData(null)
    setError(null)
    setLoaded(false)

    const isVisible = () =>
      typeof document === 'undefined' || document.visibilityState !== 'hidden'

    function clearTimer() {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    function startPolling() {
      clearTimer()
      timerRef.current = window.setInterval(() => {
        if (isVisible()) fetchNow()
      }, intervalMs)
    }

    function handleVisibilityChange() {
      if (isVisible()) {
        fetchNow()
        startPolling()
      } else {
        clearTimer()
      }
    }

    // Ensimmäinen haku tehdään aina (myös taustavälilehdessä avatusta
    // linkistä), jotta näkymä ei jää tyhjäksi.
    fetchNow()
    if (isVisible()) startPolling()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelledRef.current = true
      clearTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNow, intervalMs])

  return { data, error, loaded, refresh: fetchNow }
}
