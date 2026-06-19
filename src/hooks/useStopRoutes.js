import { useEffect, useState } from 'react'
import { getStopRoutes } from '../api/digitransit.js'

/**
 * Hakee annettujen pysäkkien reittien lyhytnimet ja kokoaa niistä yhden
 * Set:n. Tätä käytetään häiriötiedotteiden kohdistamiseen: reittikohdistettu
 * tiedote (esim. "raitiovaunu 1") on relevantti, jos kyseinen reitti pysähtyy
 * jollakin valitulla pysäkillä. Reitit muuttuvat harvoin, joten ei pollausta —
 * haku tehdään vain kun pysäkkijoukko muuttuu.
 *
 * @param {string[]} stopIds - GTFS-pysäkkien id:t
 * @returns {{ routeNames: Set<string> }}
 */
export function useStopRoutes(stopIds) {
  const [routeNames, setRouteNames] = useState(() => new Set())

  // Vakaa avain riippuvuudelle: järjestyksellä ei ole väliä, vain joukolla.
  const key = [...stopIds].sort().join('|')

  useEffect(() => {
    let cancelled = false

    if (stopIds.length === 0) {
      setRouteNames(new Set())
      return
    }

    getStopRoutes(stopIds)
      .then((byStop) => {
        if (cancelled) return
        const names = new Set()
        for (const list of Object.values(byStop)) {
          for (const name of list) names.add(name)
        }
        setRouteNames(names)
      })
      .catch(() => {
        // Reittien haku on lisätieto tiedotteiden kohdistukseen; jos se
        // epäonnistuu, jätetään joukko ennalleen eikä häiritä käyttäjää.
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { routeNames }
}
