import { APP_VERSION, APP_RELEASE_DATE, CHANGELOG_URL, REPO_URL } from '../changelog'
import { useText } from '../i18n/texts.jsx'

// Ulkoinen linkki tekstin keskelle (osoite koodissa, teksti tietokannasta).
function Link({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="modal__link-inline">
      {children}
    </a>
  )
}

export default function About({ isOpen, onClose }) {
  const t = useText()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>
            {t('about.title')}{' '}
            <span className="modal__version">v{APP_VERSION}</span>
          </h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </div>

        <div className="modal__content">
          <section className="modal__section">
            <h3>{t('about.privacy.title')}</h3>
            <p>{t('about.privacy.storage', [<code>localStorage</code>])}</p>
            <p>{t('about.privacy.server')}</p>
            <p>
              {t('about.privacy.osm', [
                <Link href="https://osmfoundation.org/wiki/Privacy_Policy">
                  {t('about.privacy.osmLink')}
                </Link>
              ])}
            </p>
            <p>
              {t('about.privacy.contact', [
                <Link href={`${REPO_URL}/issues`}>{t('about.privacy.contactLink')}</Link>
              ])}
            </p>
          </section>

          <section className="modal__section">
            <h3>{t('about.data.title')}</h3>
            <p>
              {t('about.data.source', [
                <Link href="https://digitransit.fi/">{t('about.data.sourceLink')}</Link>
              ])}
            </p>
            <p>
              {t('about.data.position', [
                <strong>{t('about.data.positionEstimate')}</strong>,
                <strong>{t('about.data.positionNoGps')}</strong>
              ])}
            </p>
          </section>

          <section className="modal__section">
            <h3>{t('about.source.title')}</h3>
            <p>{t('about.source.text')}</p>
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
            <h3>{t('about.version.title')}</h3>
            <p>
              {t('about.version.text', [<strong>v{APP_VERSION}</strong>, APP_RELEASE_DATE])}
            </p>
            <a
              href={CHANGELOG_URL}
              target="_blank"
              rel="noreferrer"
              className="modal__link"
            >
              {t('about.version.history')}
            </a>
          </section>

          <section className="modal__section">
            <h3>{t('about.licenses.title')}</h3>
            <p>
              <strong>{t('about.licenses.appLabel')}</strong> {t('about.licenses.app')}
            </p>
            <p>
              <strong>{t('about.licenses.dataLabel')}</strong> ©{' '}
              <Link href="https://digitransit.fi/">Digitransit</Link>{' '}
              {new Date().getFullYear()},{' '}
              <Link href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</Link>
            </p>
            <p>
              {t('about.licenses.terms', [
                <Link href="https://digitransit.fi/en/developers/">Digitransit Terms of Use</Link>
              ])}
            </p>
            <p>
              <strong>{t('about.licenses.mapLabel')}</strong>{' '}
              {t('about.licenses.map', [
                <Link href="https://www.openstreetmap.org/copyright">OpenStreetMap</Link>,
                <Link href="https://opendatacommons.org/licenses/odbl/">ODbL</Link>,
                <Link href="https://leafletjs.com/">Leaflet</Link>
              ])}
            </p>
          </section>
        </div>

        <div className="modal__footer">
          <button className="modal__btn-close" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
