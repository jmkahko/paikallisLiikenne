import { useState } from 'react'

const SEVERITY_LABEL = {
  INFO: 'Tiedote',
  WARNING: 'Varoitus',
  SEVERE: 'Vakava',
  UNKNOWN_SEVERITY: 'Tiedote'
}

// Lajittelu: vakavin ensin, saman vakavuuden sisällä tuorein (myöhäisin
// alkupäivä) ensin. Tiedotteet ilman alkupäivää valuvat ryhmänsä loppuun.
const SEVERITY_RANK = { SEVERE: 3, WARNING: 2, INFO: 1, UNKNOWN_SEVERITY: 0 }

function compareAlerts(a, b) {
  const bySeverity =
    (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
  if (bySeverity !== 0) return bySeverity
  const aStart = a.start ? a.start.getTime() : 0
  const bStart = b.start ? b.start.getTime() : 0
  return bStart - aStart
}

function formatRange(start, end) {
  const fmt = (d) =>
    d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })
  if (start && end) return `${fmt(start)}–${fmt(end)}`
  if (start) return `${fmt(start)} alkaen`
  if (end) return `${fmt(end)} saakka`
  return ''
}

function AlertItem({ alert }) {
  const sev = (alert.severity || 'UNKNOWN_SEVERITY').toLowerCase()
  const range = formatRange(alert.start, alert.end)
  return (
    <li className={`alert-item alert-item--${sev}`}>
      <div className="alert-item__head">
        <span className="alert-item__sev">
          {SEVERITY_LABEL[alert.severity] || 'Tiedote'}
        </span>
        {range && <span className="alert-item__dates">{range}</span>}
      </div>
      {alert.routeNames.length > 0 && (
        <p className="alert-item__routes">
          Linjat: {alert.routeNames.join(', ')}
        </p>
      )}
      {alert.header && <p className="alert-item__header">{alert.header}</p>}
      {alert.description && alert.description !== alert.header && (
        <p className="alert-item__desc">{alert.description}</p>
      )}
      {alert.url && (
        <a
          href={alert.url}
          target="_blank"
          rel="noreferrer"
          className="alert-item__link"
        >
          Lisätietoja →
        </a>
      )}
    </li>
  )
}

function AlertsModal({ isOpen, onClose, alerts }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Kaikki häiriötiedotteet ({alerts.length})</h2>
          <button className="modal__close" onClick={onClose} aria-label="Sulje">
            ✕
          </button>
        </div>
        <div className="modal__content">
          {alerts.length === 0 ? (
            <p>Ei voimassa olevia häiriötiedotteita.</p>
          ) : (
            <ul className="alerts__list">
              {alerts.map((a) => (
                <AlertItem key={a.id} alert={a} />
              ))}
            </ul>
          )}
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

export default function Alerts({
  alerts,
  loading,
  error,
  selectedStopIds,
  selectedRouteNames
}) {
  const [expanded, setExpanded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  // Älä vie tilaa jos ei tiedotteita eikä virhettä.
  if (!error && alerts.length === 0) return null

  const sorted = [...alerts].sort(compareAlerts)

  // Tiedote on relevantti jos se osuu valittuun pysäkkiin TAI valitun pysäkin
  // reittiin (esim. "raitiovaunu 1" ilman Stop-entityä) TAI se on kohdistamaton
  // koko verkon tiedote, joka koskee kaikkia (ei pysäkki- eikä reittirajausta).
  const relevant = sorted.filter((a) => {
    const matchesStop = a.stopIds.some((id) => selectedStopIds.has(id))
    const matchesRoute = a.routeNames.some((n) => selectedRouteNames.has(n))
    const untargeted = a.stopIds.length === 0 && a.routeNames.length === 0
    return matchesStop || matchesRoute || untargeted
  })

  return (
    <section className="alerts">
      <button
        type="button"
        className="alerts__toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="alerts__title">
          <span aria-hidden="true">⚠️</span> Häiriötiedotteet
          {relevant.length > 0 && (
            <span className="alerts__badge">{relevant.length}</span>
          )}
        </span>
        <span className="alerts__chevron" aria-hidden="true">
          {expanded ? '▴' : '▾'}
        </span>
      </button>

      {expanded && (
        <div className="alerts__body">
          {error && (
            <p className="alerts__error">
              Häiriötiedotteiden haku epäonnistui: {error.message || String(error)}
            </p>
          )}
          {!error && relevant.length > 0 && (
            <>
              <p className="alerts__note">
                Vaikuttavat valitsemiisi pysäkkeihin:
              </p>
              <ul className="alerts__list">
                {relevant.map((a) => (
                  <AlertItem key={a.id} alert={a} />
                ))}
              </ul>
            </>
          )}
          {!error && relevant.length === 0 && (
            <p className="alerts__note">
              Ei häiriöitä valitsemillasi pysäkeillä.
            </p>
          )}
          <button
            type="button"
            className="alerts__show-all"
            onClick={() => setModalOpen(true)}
          >
            Näytä kaikki häiriötiedotteet ({alerts.length}) →
          </button>
        </div>
      )}

      <AlertsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        alerts={sorted}
      />
    </section>
  )
}
