-- Englanninkieliset käyttöliittymätekstit (issue #29).
--
-- Englanti on käytössä (01-schema.sql: ui_language.enabled = 1), ja käyttäjä
-- valitsee sen otsikkorivin FI | EN -valinnalla. Puuttuva käännös näytetään
-- suomeksi. Avaimet ja selitteet ovat tiedostossa
-- 02-texts-fi.sql, joka ajetaan ennen tätä.
--
-- Tiedosto voittaa kuten 02-texts-fi.sql: uudelleenajo päivittää muuttuneet
-- käännökset tämän tiedoston mukaisiksi.

SET NAMES utf8mb4;

-- --- common: Yhteiset tekstit (useassa näkymässä) ---------------------------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'common', 'close',           'Close'),
  ('en', 'common', 'error',           'Error: {0}'),
  ('en', 'common', 'realtime',        'Real-time'),
  ('en', 'common', 'mode.bus',        'Bus'),
  ('en', 'common', 'mode.tram',       'Tram'),
  ('en', 'common', 'mode.rail',       'Train'),
  ('en', 'common', 'mode.ferry',      'Ferry'),
  ('en', 'common', 'mode.subway',     'Metro'),
  ('en', 'common', 'osmContributors', 'contributors')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- app: Etusivu (otsikko, pysäkin lisäys, tyhjä tila, alatunniste) --------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'app', 'title',          'Paikallisliikenne — Nysse stops'),
  ('en', 'app', 'heading',        'Paikallisliikenne'),
  ('en', 'app', 'subtitle',       'Real-time Nysse departures — choose up to {0} stops.'),
  ('en', 'app', 'aboutButton',    'About this app'),
  ('en', 'app', 'language',       'Language'),
  ('en', 'app', 'addModeLabel',   'How to add a stop'),
  ('en', 'app', 'tab.search',     'Search'),
  ('en', 'app', 'tab.map',        'Map'),
  ('en', 'app', 'stopsFull',      'Maximum number of stops ({0}) added. Remove one before adding another.'),
  ('en', 'app', 'stopCount',      '{0} / {1} stops'),
  ('en', 'app', 'departureCount', 'Departures per stop'),
  ('en', 'app', 'empty.title',    'No stops yet.'),
  ('en', 'app', 'empty.hint',     'Search for a stop above and add it by clicking a result.'),
  ('en', 'app', 'footer',         'Data: © {0} {1}/ {2}. Data licence {3}.')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopSearch: Pysäkkihaku (Haku-välilehti) -------------------------------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'stopSearch', 'label',       'Add a stop'),
  ('en', 'stopSearch', 'placeholder', 'Search by stop name or code (e.g. Keskustori, 0001)'),
  ('en', 'stopSearch', 'tooShort',    'Type at least {0} characters to search for stops.'),
  ('en', 'stopSearch', 'loading',     'Searching…'),
  ('en', 'stopSearch', 'noResults',   'No stops found for “{0}”. Try a stop name or code.')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopMap: Pysäkin valinta kartalta (Kartta-välilehti) -------------------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'stopMap', 'zoomHint', 'Zoom in to see stops.'),
  ('en', 'stopMap', 'add',      'Add stop'),
  ('en', 'stopMap', 'added',    'Already added'),
  ('en', 'stopMap', 'full',     'List full')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopCard: Pysäkkikortti ja lähdöt --------------------------------------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'stopCard', 'moveUp',       'Move up'),
  ('en', 'stopCard', 'moveDown',     'Move down'),
  ('en', 'stopCard', 'refresh',      'Refresh'),
  ('en', 'stopCard', 'remove',       'Remove stop'),
  ('en', 'stopCard', 'empty',        'No departures in the next few hours.'),
  ('en', 'stopCard', 'showTrip',     'Show route and timetable'),
  ('en', 'stopCard', 'updating',     'Updating…'),
  ('en', 'stopCard', 'updated',      'Updated {0}'),
  ('en', 'stopCard', 'now',          'now'),
  ('en', 'stopCard', 'minutes',      '{0} min'),
  ('en', 'stopCard', 'hours',        '{0} h'),
  ('en', 'stopCard', 'hoursMinutes', '{0} h {1} min')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- alerts: Häiriötiedotteet (paneeli ja "kaikki"-ikkuna). Tiedotteiden sisältö tulee Digitransitista. ---

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'alerts', 'title',            'Service alerts'),
  ('en', 'alerts', 'affecting',        'Affecting your selected stops:'),
  ('en', 'alerts', 'noneAtStops',      'No disruptions at your selected stops.'),
  ('en', 'alerts', 'loadError',        'Failed to load service alerts: {0}'),
  ('en', 'alerts', 'showAll',          'Show all service alerts ({0}) →'),
  ('en', 'alerts', 'modalTitle',       'All service alerts ({0})'),
  ('en', 'alerts', 'noneActive',       'No active service alerts.'),
  ('en', 'alerts', 'severity.info',    'Notice'),
  ('en', 'alerts', 'severity.warning', 'Warning'),
  ('en', 'alerts', 'severity.severe',  'Severe'),
  ('en', 'alerts', 'from',             'from {0}'),
  ('en', 'alerts', 'until',            'until {0}'),
  ('en', 'alerts', 'routes',           'Routes: {0}'),
  ('en', 'alerts', 'moreInfo',         'More information →')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- trip: Vuoronäkymä: yhteenveto, välilehdet, kartta, aikataulu ja jakaminen ---

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'trip', 'defaultTitle',         'Trip'),
  ('en', 'trip', 'loading',              'Loading route…'),
  ('en', 'trip', 'loadError',            'Failed to load route: {0}'),
  ('en', 'trip', 'notFound',             'Trip not found for this day. The link may be out of date.'),
  ('en', 'trip', 'summary.departure',    'Departs {0} at {1}'),
  ('en', 'trip', 'summary.arrival',      'Arrives {0} at {1}'),
  ('en', 'trip', 'summary.terminus',     'At terminus {0} at {1}'),
  ('en', 'trip', 'tabsLabel',            'Trip view'),
  ('en', 'trip', 'tab.map',              'Map'),
  ('en', 'trip', 'tab.timetable',        'Timetable'),
  ('en', 'trip', 'map.noRoute',          'No route information available for this trip.'),
  ('en', 'trip', 'map.before',           'The trip has not yet left its first stop — showing the planned route.'),
  ('en', 'trip', 'map.done',             'The trip has already ended.'),
  ('en', 'trip', 'map.legend.position',  'Estimated position'),
  ('en', 'trip', 'map.legend.ahead',     'Ahead'),
  ('en', 'trip', 'map.legend.traveled',  'Travelled'),
  ('en', 'trip', 'map.vehicle.bus',      'Estimated position of the bus'),
  ('en', 'trip', 'map.vehicle.tram',     'Estimated position of the tram'),
  ('en', 'trip', 'map.departedFrom',     'Left stop {0} at {1}'),
  ('en', 'trip', 'map.role.from',        'Boarding stop'),
  ('en', 'trip', 'map.role.to',          'Alighting stop'),
  ('en', 'trip', 'map.role.origin',      'Origin'),
  ('en', 'trip', 'map.role.destination', 'Destination'),
  ('en', 'trip', 'timetable.hint',       'Choose the stop where you get off — the arrival time is shown above and the stop is included in the shared link.'),
  ('en', 'trip', 'timetable.selectTo',   'I get off at this stop'),
  ('en', 'trip', 'timetable.unselect',   'Clear selection'),
  ('en', 'trip', 'timetable.boarding',   'On'),
  ('en', 'trip', 'timetable.alighting',  'Off'),
  ('en', 'trip', 'share.button',         'Share'),
  ('en', 'trip', 'share.title',          'Share a link to this trip'),
  ('en', 'trip', 'share.copied',         'Message and link copied to clipboard'),
  ('en', 'trip', 'share.manual',         'Copy link:'),
  ('en', 'trip', 'share.departure',      'departs {0} at {1}'),
  ('en', 'trip', 'share.arrival',        'arrives {0} at approx. {1}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- privacy: Tietosuojailmoitus (sivun alareuna, kunnes kuitattu) ----------

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'privacy', 'title',  'Privacy'),
  ('en', 'privacy', 'text',   'This app stores your selected stops in your browser''s local storage ({0}) so that they are kept between page loads. No cookies or analytics are used. When you open the map, map images are loaded from OpenStreetMap''s servers, which then see your IP address, browser details and the map area viewed. More information in the About window (ℹ️).'),
  ('en', 'privacy', 'accept', 'Got it')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- about: Tietoja-ikkuna (ℹ️). Linkkien osoitteet ovat koodissa, täällä vain linkkitekstit. ---

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('en', 'about', 'title',                 'About this app'),
  ('en', 'about', 'privacy.title',         'Privacy'),
  ('en', 'about', 'privacy.storage',       'This app stores your selected stops, the number of departures shown, your chosen language and your acknowledgement of the privacy notice in your browser''s local storage ({0}). Your choices are not stored on the server. No cookies or analytics are used.'),
  ('en', 'about', 'privacy.server',        'Stop and timetable data is fetched from the Digitransit API via this site''s own server, so Digitransit does not see your IP address. The web server hosting this site keeps standard server logs (including IP address, time and requested address).'),
  ('en', 'about', 'privacy.osm',           'When you open the map (Map tab or trip route), map images are loaded directly from the OpenStreetMap Foundation''s servers. They then see your IP address, browser and operating system details, the site address and the map area viewed. OpenStreetMap is not contacted unless you open the map. See {0}.'),
  ('en', 'about', 'privacy.osmLink',       'the OpenStreetMap Foundation privacy policy'),
  ('en', 'about', 'privacy.contact',       'Maintainer: kahkonen.dev. Contact via {0}.'),
  ('en', 'about', 'privacy.contactLink',   'the GitHub Issues page'),
  ('en', 'about', 'data.title',            'Real-time data'),
  ('en', 'about', 'data.source',           'All bus and tram departure data is fetched via {0} and refreshed every 30 seconds. The app and its developers are not responsible for the accuracy or timeliness of the data, or for any damage resulting from its use.'),
  ('en', 'about', 'data.sourceLink',       'the Digitransit API'),
  ('en', 'about', 'data.position',         'The bus or tram position shown on the map is {0} (which stop the trip last left and when). It {1} and should not be relied on as the actual position of the bus or tram.'),
  ('en', 'about', 'data.positionEstimate', 'only an estimate based on the timetable'),
  ('en', 'about', 'data.positionNoGps',    'is not based on GPS positioning'),
  ('en', 'about', 'source.title',          'Source code'),
  ('en', 'about', 'source.text',           'This app is an open-source project. You can view the code on GitHub:'),
  ('en', 'about', 'version.title',         'Version'),
  ('en', 'about', 'version.text',          'Running {0} (released {1}).'),
  ('en', 'about', 'version.history',       'View version history →'),
  ('en', 'about', 'licenses.title',        'Licences and data'),
  ('en', 'about', 'licenses.appLabel',     'App:'),
  ('en', 'about', 'licenses.app',          '© kahkonen.dev, open-source project.'),
  ('en', 'about', 'licenses.dataLabel',    'Data:'),
  ('en', 'about', 'licenses.terms',        'See {0}.'),
  ('en', 'about', 'licenses.mapLabel',     'Map:'),
  ('en', 'about', 'licenses.map',          '© {0} contributors, licence {1}. Map library {2}.')
ON DUPLICATE KEY UPDATE value = VALUES(value);
