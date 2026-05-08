import { useLocalStorage } from '../hooks/useLocalStorage.js'

const PRIVACY_KEY = 'paikallis.privacy.v1'

export default function PrivacyBanner() {
  const [accepted, setAccepted] = useLocalStorage(PRIVACY_KEY, false)

  if (accepted) return null

  return (
    <div className="privacy-banner">
      <div className="privacy-banner__content">
        <p className="privacy-banner__title">Tietosuoja</p>
        <p className="privacy-banner__text">
          Tämä sovellus tallentaa valitsemasi pysäkit selaimen paikalliseen
          tallennustilaan (<code>localStorage</code>), jotta ne säilyvät
          sivulatausten välillä. Tietoja ei lähetetä ulkopuolisille palvelimille
          eikä evästeitä käytetä. Pysäkkitiedot haetaan Digitransit-rajapinnasta
          oman palvelimen kautta.
        </p>
        <button
          className="privacy-banner__btn"
          onClick={() => setAccepted(true)}
        >
          Selvä
        </button>
      </div>
    </div>
  )
}
