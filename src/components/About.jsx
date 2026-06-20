import { APP_VERSION, APP_RELEASE_DATE, CHANGELOG_URL } from '../changelog'

export default function About({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            Tietoja sovelluksesta{' '}
            <span className="modal__version">v{APP_VERSION}</span>
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Sulje"
          >
            ✕
          </button>
        </div>

        <div className="modal__content">
          <section className="modal__section">
            <h3>Tietosuoja</h3>
            <p>
              Tämä sovellus tallentaa valitsemasi pysäkit selaimen paikalliseen
              tallennustilaan (<code>localStorage</code>), jotta ne säilyvät
              sivulatausten välillä. Tietoja ei lähetetä ulkopuolisille
              palvelimille eikä evästeitä käytetä. Pysäkkitiedot haetaan
              Digitransit-rajapinnasta oman palvelimen kautta.
            </p>
          </section>

          <section className="modal__section">
            <h3>Reaaliaikainen data</h3>
            <p>
              Kaikki bussi- ja raitiovaunujen lähtötiedot haetaan{' '}
              <a
                href="https://digitransit.fi/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                Digitransit-rajapinnan
              </a>{' '}
              kautta ja päivitetään 30 sekunnin välein. Sovellus tai sen
              kehittäjät eivät ole vastuussa tietojen oikeellisuudesta,
              ajantasaisuudesta tai käytöstä johtuneista vahingoista.
            </p>
          </section>

          <section className="modal__section">
            <h3>Lähdekoodi</h3>
            <p>
              Sovellus on avoimen lähdekoodin projekti. Voit katsoa koodin
              GitHubissa:
            </p>
            <a
              href="https://github.com/jmkahko/paikallisLiikenne"
              target="_blank"
              rel="noreferrer"
              className="modal__link"
            >
              github.com/jmkahko/paikallisLiikenne →
            </a>
          </section>

          <section className="modal__section">
            <h3>Versio</h3>
            <p>
              Käytössä <strong>v{APP_VERSION}</strong> (julkaistu{' '}
              {APP_RELEASE_DATE}).
            </p>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              className="modal__link"
            >
              Katso versiohistoria →
            </a>
          </section>

          <section className="modal__section">
            <h3>Lisenssit ja tiedot</h3>
            <p>
              <strong>Sovellus:</strong> © kahkonen.dev, avoimen lähdekoodin
              projekti.
            </p>
            <p>
              <strong>Tiedot:</strong> © <a
                href="https://digitransit.fi/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                Digitransit
              </a>{' '}
              {new Date().getFullYear()},{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                CC BY 4.0
              </a>
            </p>
            <p>
              Katso{' '}
              <a
                href="https://digitransit.fi/en/developers/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                Digitransit Terms of Use
              </a>
              .
            </p>
            <p>
              <strong>Kartta:</strong> © <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                OpenStreetMap
              </a>{' '}
              -tekijät, lisenssi{' '}
              <a
                href="https://opendatacommons.org/licenses/odbl/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                ODbL
              </a>
              . Karttakirjasto{' '}
              <a
                href="https://leafletjs.com/"
                target="_blank"
                rel="noreferrer"
                className="modal__link-inline"
              >
                Leaflet
              </a>
              .
            </p>
          </section>
        </div>

        <div className="modal__footer">
          <button className="modal__btn-close" onClick={onClose}>
            Sulje
          </button>
        </div>
      </div>
    </div>
  )
}
