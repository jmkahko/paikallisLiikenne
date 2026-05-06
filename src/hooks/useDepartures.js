import { useEffect, useRef, useState, useCallback } from 'react'
import { getStopDepartures } from '../api/digitransit.js'

/**
 * Hakee annetun pysäkin lähdöt ja päivittää annetulla intervallilla.
 * Polling pysäytetään automaattisesti kun välilehti ei ole näkyvissä
 * (Page Visibility API) ja jatketaan kun välilehti palaa näkyviin.
 *
 * @param {string} stopId
 * @param {number} intervalMs
 * @param {number} numberOfDepartures
 */
export function useDepartures(stopId, intervalMs = 30_000, numberOfDepartures = 5) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)

  const fetchNow = useCallback(async () => {
    if (!stopId) return
    setLoading(true)
    try {
      const result = await getStopDepartures(stopId, numberOfDepartures)
      if (cancelledRef.current) return
      setData(result)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      if (cancelledRef.current) return
      setError(e)
    } finally {
      if (!cancelledRef.current) setLoading(false)
    }
  }, [stopId, numberOfDepartures])

  useEffect(() => {
    cancelledRef.current = false

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
        // Varmistus: jos välilehti piiloutuu juuri ennen tikitystä, älä kutsu.
        if (isVisible()) fetchNow()
      }, intervalMs)
    }

    function handleVisibilityChange() {
      if (isVisible()) {
        // Välilehti palasi näkyviin — päivitä heti ja jatka polingia.
        fetchNow()
        startPolling()
      } else {
        // Välilehti piilossa — pysäytä taustakutsut.
        clearTimer()
      }
    }

    // Ensimmäinen haku heti, sitten käynnistä poling jos välilehti on näkyvissä.
    if (isVisible()) {
      fetchNow()
      startPolling()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelledRef.current = true
      clearTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNow, intervalMs])

  return { data, error, loading, lastUpdated, refresh: fetchNow }
}
