-- Suomenkieliset käyttöliittymätekstit (issue #29).
--
-- Tiedosto voittaa: tämä on suomenkielisten tekstien virallinen lähde.
-- Tiedoston voi ajaa uudelleen (esim. phpMyAdminin Tuo- tai SQL-välilehdellä)
-- kantaan, jossa rivit jo ovat: puuttuvat lisätään ja muuttuneet päivitetään
-- tämän tiedoston mukaisiksi (ON DUPLICATE KEY UPDATE). Korjaa teksti siis
-- tähän tiedostoon — kantaan käsin tehty muutos kumoutuu seuraavalla ajolla,
-- ellei sitä ole tehty myös tänne. Tiedostosta poistettu rivi jää kantaan.
--
-- VALUES(sarake) toimii kaikissa MySQL-versioissa (8.0.20+ antaa siitä
-- vanhentumisvaroituksen, mutta ajo onnistuu).
--
-- Paikanpitimet {0}, {1}, … korvataan koodissa annetuilla arvoilla (luku,
-- teksti tai linkki). Linkkien osoitteet ovat koodissa, vain teksti on täällä.
-- Avaimet (ui_text_key) ja niiden selitteet ovat tässä tiedostossa; muut kielet
-- (esim. 03-texts-en.sql) sisältävät vain käännökset.

SET NAMES utf8mb4;

-- --- common: Yhteiset tekstit (useassa näkymässä) ---------------------------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('common', 'close',           'Sulje-painike ja ✕-painikkeen ruudunlukijan nimi (ikkunat)'),
  ('common', 'error',           'Virheilmoitus. {0} = virheen kuvaus'),
  ('common', 'realtime',        'Vihreän reaaliaikamerkin tooltip'),
  ('common', 'mode.bus',        'Kulkumuoto (pysäkkikortti, jaettu viesti)'),
  ('common', 'mode.tram',       'Kulkumuoto (pysäkkikortti, jaettu viesti)'),
  ('common', 'mode.rail',       'Kulkumuoto (pysäkkikortti)'),
  ('common', 'mode.ferry',      'Kulkumuoto (pysäkkikortti)'),
  ('common', 'mode.subway',     'Kulkumuoto (pysäkkikortti)'),
  ('common', 'osmContributors', 'Kartan alakulman attribuutio: "© OpenStreetMap" + tämä teksti')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'common', 'close',           'Sulje'),
  ('fi', 'common', 'error',           'Virhe: {0}'),
  ('fi', 'common', 'realtime',        'Reaaliaikainen'),
  ('fi', 'common', 'mode.bus',        'Bussi'),
  ('fi', 'common', 'mode.tram',       'Raitiovaunu'),
  ('fi', 'common', 'mode.rail',       'Juna'),
  ('fi', 'common', 'mode.ferry',      'Lautta'),
  ('fi', 'common', 'mode.subway',     'Metro'),
  ('fi', 'common', 'osmContributors', '-tekijät')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- app: Etusivu (otsikko, pysäkin lisäys, tyhjä tila, alatunniste) --------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('app', 'title',          'Selaimen välilehden otsikko'),
  ('app', 'heading',        'Sivun pääotsikko; myös jakovalikon otsikko'),
  ('app', 'subtitle',       'Pääotsikon alla. {0} = pysäkkien enimmäismäärä'),
  ('app', 'aboutButton',    'ℹ️-painikkeen tooltip ja ruudunlukijan nimi'),
  ('app', 'language',       'Kielivalinnan tooltip ja ruudunlukijan nimi'),
  ('app', 'addModeLabel',   'Ruudunlukijan nimi Haku/Kartta-välilehdille'),
  ('app', 'tab.search',     'Pysäkin lisäys: hakuvälilehti'),
  ('app', 'tab.map',        'Pysäkin lisäys: karttavälilehti'),
  ('app', 'stopsFull',      'Hakukentän alla, kun pysäkkejä on enimmäismäärä. {0} = enimmäismäärä'),
  ('app', 'stopCount',      'Pysäkkilaskuri. {0} = valittujen määrä, {1} = enimmäismäärä'),
  ('app', 'departureCount', 'Lähtöjen määrän valinnan otsikko'),
  ('app', 'empty.title',    'Kun yhtään pysäkkiä ei ole valittu'),
  ('app', 'empty.hint',     'Kun yhtään pysäkkiä ei ole valittu, ohje'),
  ('app', 'footer',         'Alatunniste. {0} = Digitransit-linkki, {1} = vuosi, {2} = Nysse-linkki, {3} = lisenssilinkki')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'app', 'title',          'Paikallisliikenne — Nysse pysäkit'),
  ('fi', 'app', 'heading',        'Paikallisliikenne'),
  ('fi', 'app', 'subtitle',       'Reaaliaikaiset Nysse-lähdöt — valitse jopa {0} pysäkkiä.'),
  ('fi', 'app', 'aboutButton',    'Tietoja sovelluksesta'),
  ('fi', 'app', 'language',       'Kieli'),
  ('fi', 'app', 'addModeLabel',   'Pysäkin lisäystapa'),
  ('fi', 'app', 'tab.search',     'Haku'),
  ('fi', 'app', 'tab.map',        'Kartta'),
  ('fi', 'app', 'stopsFull',      'Maksimimäärä ({0}) pysäkkiä lisätty. Poista jokin ennen uutta.'),
  ('fi', 'app', 'stopCount',      '{0} / {1} pysäkkiä'),
  ('fi', 'app', 'departureCount', 'Lähtöjä per pysäkki'),
  ('fi', 'app', 'empty.title',    'Ei vielä pysäkkejä.'),
  ('fi', 'app', 'empty.hint',     'Etsi pysäkki yltä ja lisää se klikkaamalla tulosta.'),
  ('fi', 'app', 'footer',         'Tiedot: © {0} {1}/ {2}. Aineistolisenssi {3}.')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopSearch: Pysäkkihaku (Haku-välilehti) -------------------------------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('stopSearch', 'label',       'Hakukentän otsikko'),
  ('stopSearch', 'placeholder', 'Hakukentän esimerkkiteksti'),
  ('stopSearch', 'tooShort',    'Liian lyhyt hakusana. {0} = merkkien vähimmäismäärä'),
  ('stopSearch', 'loading',     'Haku käynnissä'),
  ('stopSearch', 'noResults',   'Ei hakutuloksia. {0} = hakusana')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'stopSearch', 'label',       'Lisää pysäkki'),
  ('fi', 'stopSearch', 'placeholder', 'Hae pysäkin nimellä tai koodilla (esim. Keskustori, 0001)'),
  ('fi', 'stopSearch', 'tooShort',    'Syötä vähintään {0} merkkiä hakeaksesi pysäkkejä.'),
  ('fi', 'stopSearch', 'loading',     'Haetaan…'),
  ('fi', 'stopSearch', 'noResults',   'Ei pysäkkejä haulla ”{0}”. Kokeile pysäkin nimeä tai koodia.')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopMap: Pysäkin valinta kartalta (Kartta-välilehti) -------------------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('stopMap', 'zoomHint', 'Kartan yläpuolella, kun kartta on liian kaukana'),
  ('stopMap', 'add',      'Pysäkin ponnahdusikkunan painike'),
  ('stopMap', 'added',    'Painike, kun pysäkki on jo listalla'),
  ('stopMap', 'full',     'Painike, kun pysäkkejä on enimmäismäärä')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'stopMap', 'zoomHint', 'Zoomaa lähemmäs nähdäksesi pysäkit.'),
  ('fi', 'stopMap', 'add',      'Lisää pysäkki'),
  ('fi', 'stopMap', 'added',    'Jo lisätty'),
  ('fi', 'stopMap', 'full',     'Lista täynnä')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- stopCard: Pysäkkikortti ja lähdöt --------------------------------------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('stopCard', 'moveUp',       'Painikkeen ↑ tooltip'),
  ('stopCard', 'moveDown',     'Painikkeen ↓ tooltip'),
  ('stopCard', 'refresh',      'Painikkeen ↻ tooltip'),
  ('stopCard', 'remove',       'Painikkeen ✕ tooltip'),
  ('stopCard', 'empty',        'Kun pysäkiltä ei ole lähtöjä'),
  ('stopCard', 'showTrip',     'Lähtörivin tooltip'),
  ('stopCard', 'updating',     'Kortin alareuna päivityksen aikana'),
  ('stopCard', 'updated',      'Kortin alareuna. {0} = kellonaika'),
  ('stopCard', 'now',          'Lähtö nyt (aikalaskuri)'),
  ('stopCard', 'minutes',      'Aikalaskuri. {0} = minuutit'),
  ('stopCard', 'hours',        'Aikalaskuri. {0} = tunnit'),
  ('stopCard', 'hoursMinutes', 'Aikalaskuri. {0} = tunnit, {1} = minuutit')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'stopCard', 'moveUp',       'Siirrä ylös'),
  ('fi', 'stopCard', 'moveDown',     'Siirrä alas'),
  ('fi', 'stopCard', 'refresh',      'Päivitä'),
  ('fi', 'stopCard', 'remove',       'Poista pysäkki'),
  ('fi', 'stopCard', 'empty',        'Ei tulevia lähtöjä lähitunteina.'),
  ('fi', 'stopCard', 'showTrip',     'Näytä reitti ja aikataulu'),
  ('fi', 'stopCard', 'updating',     'Päivitetään…'),
  ('fi', 'stopCard', 'updated',      'Päivitetty {0}'),
  ('fi', 'stopCard', 'now',          'nyt'),
  ('fi', 'stopCard', 'minutes',      '{0} min'),
  ('fi', 'stopCard', 'hours',        '{0} t'),
  ('fi', 'stopCard', 'hoursMinutes', '{0} t {1} min')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- alerts: Häiriötiedotteet (paneeli ja "kaikki"-ikkuna). Tiedotteiden sisältö tulee Digitransitista. ---

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('alerts', 'title',            'Paneelin otsikko'),
  ('alerts', 'affecting',        'Ennen valittuja pysäkkejä koskevia tiedotteita'),
  ('alerts', 'noneAtStops',      'Kun valituilla pysäkeillä ei ole tiedotteita'),
  ('alerts', 'loadError',        'Haku epäonnistui. {0} = virheen kuvaus'),
  ('alerts', 'showAll',          'Painike. {0} = tiedotteiden määrä'),
  ('alerts', 'modalTitle',       'Ikkunan otsikko. {0} = tiedotteiden määrä'),
  ('alerts', 'noneActive',       'Ikkuna, kun tiedotteita ei ole'),
  ('alerts', 'severity.info',    'Tiedotteen tyyppi'),
  ('alerts', 'severity.warning', 'Tiedotteen tyyppi'),
  ('alerts', 'severity.severe',  'Tiedotteen tyyppi'),
  ('alerts', 'from',             'Voimassaolo. {0} = alkupäivä'),
  ('alerts', 'until',            'Voimassaolo. {0} = loppupäivä'),
  ('alerts', 'routes',           'Tiedotteen linjat. {0} = linjat pilkulla eroteltuina'),
  ('alerts', 'moreInfo',         'Linkki tiedotteen lisätietoihin')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'alerts', 'title',            'Häiriötiedotteet'),
  ('fi', 'alerts', 'affecting',        'Vaikuttavat valitsemiisi pysäkkeihin:'),
  ('fi', 'alerts', 'noneAtStops',      'Ei häiriöitä valitsemillasi pysäkeillä.'),
  ('fi', 'alerts', 'loadError',        'Häiriötiedotteiden haku epäonnistui: {0}'),
  ('fi', 'alerts', 'showAll',          'Näytä kaikki häiriötiedotteet ({0}) →'),
  ('fi', 'alerts', 'modalTitle',       'Kaikki häiriötiedotteet ({0})'),
  ('fi', 'alerts', 'noneActive',       'Ei voimassa olevia häiriötiedotteita.'),
  ('fi', 'alerts', 'severity.info',    'Tiedote'),
  ('fi', 'alerts', 'severity.warning', 'Varoitus'),
  ('fi', 'alerts', 'severity.severe',  'Vakava'),
  ('fi', 'alerts', 'from',             '{0} alkaen'),
  ('fi', 'alerts', 'until',            '{0} saakka'),
  ('fi', 'alerts', 'routes',           'Linjat: {0}'),
  ('fi', 'alerts', 'moreInfo',         'Lisätietoja →')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- trip: Vuoronäkymä: yhteenveto, välilehdet, kartta, aikataulu ja jakaminen ---

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('trip', 'defaultTitle',         'Otsikko ennen kuin määränpää on ladattu'),
  ('trip', 'loading',              'Latauksen aikana'),
  ('trip', 'loadError',            'Lataus epäonnistui. {0} = virheen kuvaus'),
  ('trip', 'notFound',             'Jaettu linkki vanhalle tai väärälle päivälle'),
  ('trip', 'summary.departure',    'Yhteenveto. {0} = pysäkki (lihavoitu), {1} = kellonaika'),
  ('trip', 'summary.arrival',      'Yhteenveto, kun jääpoispysäkki on valittu. {0} = pysäkki, {1} = kellonaika'),
  ('trip', 'summary.terminus',     'Yhteenveto ilman jääpoispysäkkiä. {0} = päätepysäkki, {1} = kellonaika'),
  ('trip', 'tabsLabel',            'Ruudunlukijan nimi välilehdille'),
  ('trip', 'tab.map',              'Välilehti'),
  ('trip', 'tab.timetable',        'Välilehti'),
  ('trip', 'map.noRoute',          'Kun reittiviivaa ei ole'),
  ('trip', 'map.before',           'Kartan yläpuolella ennen lähtöä'),
  ('trip', 'map.done',             'Kartan yläpuolella vuoron päätyttyä'),
  ('trip', 'map.legend.position',  'Selite: arvioitu sijainti'),
  ('trip', 'map.legend.ahead',     'Selite: ajamaton reitti'),
  ('trip', 'map.legend.traveled',  'Selite: ajettu reitti'),
  ('trip', 'map.vehicle.bus',      'Sijaintimerkin ponnahdusikkuna (bussi)'),
  ('trip', 'map.vehicle.tram',     'Sijaintimerkin ponnahdusikkuna (raitiovaunu)'),
  ('trip', 'map.departedFrom',     'Sijaintimerkin ponnahdusikkuna. {0} = pysäkki, {1} = kellonaika'),
  ('trip', 'map.role.from',        'Pysäkin ponnahdusikkuna'),
  ('trip', 'map.role.to',          'Pysäkin ponnahdusikkuna'),
  ('trip', 'map.role.origin',      'Pysäkin ponnahdusikkuna (ensimmäinen pysäkki)'),
  ('trip', 'map.role.destination', 'Pysäkin ponnahdusikkuna (viimeinen pysäkki)'),
  ('trip', 'timetable.hint',       'Aikataulu-välilehden ohje'),
  ('trip', 'timetable.selectTo',   'Pysäkkirivin tooltip'),
  ('trip', 'timetable.unselect',   'Valitun pysäkkirivin tooltip'),
  ('trip', 'timetable.boarding',   'Merkki nousupysäkin rivillä'),
  ('trip', 'timetable.alighting',  'Merkki jääpoispysäkin rivillä'),
  ('trip', 'share.button',         'Jaa-painike'),
  ('trip', 'share.title',          'Jaa-painikkeen tooltip'),
  ('trip', 'share.copied',         'Ilmoitus kopioinnin jälkeen'),
  ('trip', 'share.manual',         'Käsin kopioitavan kentän otsikko'),
  ('trip', 'share.departure',      'Jaettu viesti. {0} = pysäkki, {1} = kellonaika'),
  ('trip', 'share.arrival',        'Jaettu viesti. {0} = pysäkki, {1} = kellonaika')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'trip', 'defaultTitle',         'Vuoro'),
  ('fi', 'trip', 'loading',              'Ladataan reittiä…'),
  ('fi', 'trip', 'loadError',            'Reitin lataus epäonnistui: {0}'),
  ('fi', 'trip', 'notFound',             'Vuoroa ei löytynyt tälle päivälle. Linkki voi olla vanhentunut.'),
  ('fi', 'trip', 'summary.departure',    'Lähtö {0} klo {1}'),
  ('fi', 'trip', 'summary.arrival',      'Perillä {0} klo {1}'),
  ('fi', 'trip', 'summary.terminus',     'Päätepysäkillä {0} klo {1}'),
  ('fi', 'trip', 'tabsLabel',            'Vuoron näkymä'),
  ('fi', 'trip', 'tab.map',              'Kartta'),
  ('fi', 'trip', 'tab.timetable',        'Aikataulu'),
  ('fi', 'trip', 'map.noRoute',          'Reittitietoa ei ole saatavilla tälle vuorolle.'),
  ('fi', 'trip', 'map.before',           'Vuoro ei ole vielä lähtenyt lähtöpysäkiltä — näytetään suunniteltu reitti.'),
  ('fi', 'trip', 'map.done',             'Vuoro on jo päättynyt.'),
  ('fi', 'trip', 'map.legend.position',  'Arvioitu sijainti'),
  ('fi', 'trip', 'map.legend.ahead',     'Edessä'),
  ('fi', 'trip', 'map.legend.traveled',  'Ajettu'),
  ('fi', 'trip', 'map.vehicle.bus',      'Bussin arvioitu sijainti'),
  ('fi', 'trip', 'map.vehicle.tram',     'Raitiovaunun arvioitu sijainti'),
  ('fi', 'trip', 'map.departedFrom',     'Lähtenyt pysäkiltä {0} klo {1}'),
  ('fi', 'trip', 'map.role.from',        'Nousupysäkki'),
  ('fi', 'trip', 'map.role.to',          'Jääpoispysäkki'),
  ('fi', 'trip', 'map.role.origin',      'Lähtö'),
  ('fi', 'trip', 'map.role.destination', 'Määränpää'),
  ('fi', 'trip', 'timetable.hint',       'Valitse pysäkki, jolla jäät pois — saapumisaika näkyy yllä ja pysäkki tulee mukaan jaettavaan linkkiin.'),
  ('fi', 'trip', 'timetable.selectTo',   'Jään pois tällä pysäkillä'),
  ('fi', 'trip', 'timetable.unselect',   'Poista valinta'),
  ('fi', 'trip', 'timetable.boarding',   'Nousu'),
  ('fi', 'trip', 'timetable.alighting',  'Pois'),
  ('fi', 'trip', 'share.button',         'Jaa'),
  ('fi', 'trip', 'share.title',          'Jaa linkki tähän vuoroon'),
  ('fi', 'trip', 'share.copied',         'Viesti ja linkki kopioitu leikepöydälle'),
  ('fi', 'trip', 'share.manual',         'Kopioi linkki:'),
  ('fi', 'trip', 'share.departure',      'lähtö {0} klo {1}'),
  ('fi', 'trip', 'share.arrival',        'perillä {0} arviolta klo {1}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- privacy: Tietosuojailmoitus (sivun alareuna, kunnes kuitattu) ----------

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('privacy', 'title',  'Ilmoituksen otsikko'),
  ('privacy', 'text',   'Ilmoituksen teksti. {0} = localStorage (koodimuotoilu)'),
  ('privacy', 'accept', 'Kuittauspainike')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'privacy', 'title',  'Tietosuoja'),
  ('fi', 'privacy', 'text',   'Tämä sovellus tallentaa valitsemasi pysäkit selaimen paikalliseen tallennustilaan ({0}), jotta ne säilyvät sivulatausten välillä. Evästeitä tai analytiikkaa ei käytetä. Kun avaat kartan, karttakuvat ladataan OpenStreetMapin palvelimelta, joka näkee tällöin IP-osoitteesi, selaimesi tiedot ja katsotun kartta-alueen. Lisätietoja Tietoja-ikkunassa (ℹ️).'),
  ('fi', 'privacy', 'accept', 'Selvä')
ON DUPLICATE KEY UPDATE value = VALUES(value);

-- --- about: Tietoja-ikkuna (ℹ️). Linkkien osoitteet ovat koodissa, täällä vain linkkitekstit. ---

INSERT INTO ui_text_key (text_group, text_key, note) VALUES
  ('about', 'title',                 'Ikkunan otsikko (versionumero perässä)'),
  ('about', 'privacy.title',         'Osion otsikko'),
  ('about', 'privacy.storage',       'Mitä selaimeen tallennetaan. {0} = localStorage (koodimuotoilu)'),
  ('about', 'privacy.server',        'Palvelimen kautta haettavat tiedot ja lokit'),
  ('about', 'privacy.osm',           'Karttakuvat OpenStreetMapista. {0} = linkki tietosuojakäytäntöön (teksti: about.privacy.osmLink)'),
  ('about', 'privacy.osmLink',       'Linkkiteksti (osoite koodissa)'),
  ('about', 'privacy.contact',       'Ylläpitäjä. {0} = linkki GitHubin Issues-sivulle (teksti: about.privacy.contactLink). Päivitä, jos julkaiset sovelluksen omalla sivustollasi.'),
  ('about', 'privacy.contactLink',   'Linkkiteksti (osoite koodissa)'),
  ('about', 'data.title',            'Osion otsikko'),
  ('about', 'data.source',           'Tietolähde ja vastuuvapautus. {0} = Digitransit-linkki (teksti: about.data.sourceLink). Mainitsee 30 s päivitysvälin.'),
  ('about', 'data.sourceLink',       'Linkkiteksti (osoite koodissa)'),
  ('about', 'data.position',         'Sijainti on arvio. {0} = about.data.positionEstimate (lihavoitu), {1} = about.data.positionNoGps (lihavoitu)'),
  ('about', 'data.positionEstimate', 'Lihavoitu osa tekstiä about.data.position'),
  ('about', 'data.positionNoGps',    'Lihavoitu osa tekstiä about.data.position'),
  ('about', 'source.title',          'Osion otsikko'),
  ('about', 'source.text',           'Ennen GitHub-linkkiä'),
  ('about', 'version.title',         'Osion otsikko'),
  ('about', 'version.text',          '{0} = versionumero (lihavoitu), {1} = julkaisupäivä'),
  ('about', 'version.history',       'Linkki CHANGELOG.md:hen'),
  ('about', 'licenses.title',        'Osion otsikko'),
  ('about', 'licenses.appLabel',     'Lihavoitu rivin alku'),
  ('about', 'licenses.app',          'Sovelluksen tekijänoikeus'),
  ('about', 'licenses.dataLabel',    'Lihavoitu rivin alku (perässä © Digitransit, vuosi, CC BY 4.0)'),
  ('about', 'licenses.terms',        '{0} = linkki "Digitransit Terms of Use"'),
  ('about', 'licenses.mapLabel',     'Lihavoitu rivin alku'),
  ('about', 'licenses.map',          '{0} = OpenStreetMap-linkki, {1} = ODbL-linkki, {2} = Leaflet-linkki')
ON DUPLICATE KEY UPDATE note = VALUES(note);

INSERT INTO ui_text (lang, text_group, text_key, value) VALUES
  ('fi', 'about', 'title',                 'Tietoja sovelluksesta'),
  ('fi', 'about', 'privacy.title',         'Tietosuoja'),
  ('fi', 'about', 'privacy.storage',       'Tämä sovellus tallentaa valitsemasi pysäkit, näytettävien lähtöjen määrän, valitsemasi kielen ja tietosuojailmoituksen kuittauksen selaimen paikalliseen tallennustilaan ({0}). Valintoja ei tallenneta palvelimelle. Evästeitä tai analytiikkaa ei käytetä.'),
  ('fi', 'about', 'privacy.server',        'Pysäkki- ja aikataulutiedot haetaan Digitransit-rajapinnasta tämän sivuston oman palvelimen kautta, joten Digitransit ei näe IP-osoitettasi. Sivustoa palveleva web-palvelin tallentaa tavanomaiset palvelinlokit (mm. IP-osoite, ajankohta ja pyydetty osoite).'),
  ('fi', 'about', 'privacy.osm',           'Kun avaat kartan (Kartta-välilehti tai vuoron reitti), karttakuvat ladataan suoraan OpenStreetMap Foundationin palvelimelta. Se näkee tällöin IP-osoitteesi, selaimesi ja käyttöjärjestelmäsi tiedot, sivuston osoitteen sekä katsotun kartta-alueen. Ilman kartan avaamista OpenStreetMapiin ei oteta yhteyttä. Katso {0}.'),
  ('fi', 'about', 'privacy.osmLink',       'OpenStreetMap Foundationin tietosuojakäytäntö'),
  ('fi', 'about', 'privacy.contact',       'Ylläpitäjä: kahkonen.dev. Yhteydenotot {0} kautta.'),
  ('fi', 'about', 'privacy.contactLink',   'GitHubin Issues-sivun'),
  ('fi', 'about', 'data.title',            'Reaaliaikainen data'),
  ('fi', 'about', 'data.source',           'Kaikki bussi- ja raitiovaunujen lähtötiedot haetaan {0} kautta ja päivitetään 30 sekunnin välein. Sovellus tai sen kehittäjät eivät ole vastuussa tietojen oikeellisuudesta, ajantasaisuudesta tai käytöstä johtuneista vahingoista.'),
  ('fi', 'about', 'data.sourceLink',       'Digitransit-rajapinnan'),
  ('fi', 'about', 'data.position',         'Kartalla näkyvä bussin tai raitiovaunun sijainti on {0} (miltä pysäkiltä vuoro on viimeksi lähtenyt ja milloin). Se {1}, eikä sitä tule käyttää luotettavana tietona bussin tai raitiovaunun todellisesta sijainnista.'),
  ('fi', 'about', 'data.positionEstimate', 'pelkkä arvio aikataulun perusteella'),
  ('fi', 'about', 'data.positionNoGps',    'ei perustu GPS-paikannukseen'),
  ('fi', 'about', 'source.title',          'Lähdekoodi'),
  ('fi', 'about', 'source.text',           'Sovellus on avoimen lähdekoodin projekti. Voit katsoa koodin GitHubissa:'),
  ('fi', 'about', 'version.title',         'Versio'),
  ('fi', 'about', 'version.text',          'Käytössä {0} (julkaistu {1}).'),
  ('fi', 'about', 'version.history',       'Katso versiohistoria →'),
  ('fi', 'about', 'licenses.title',        'Lisenssit ja tiedot'),
  ('fi', 'about', 'licenses.appLabel',     'Sovellus:'),
  ('fi', 'about', 'licenses.app',          '© kahkonen.dev, avoimen lähdekoodin projekti.'),
  ('fi', 'about', 'licenses.dataLabel',    'Tiedot:'),
  ('fi', 'about', 'licenses.terms',        'Katso {0}.'),
  ('fi', 'about', 'licenses.mapLabel',     'Kartta:'),
  ('fi', 'about', 'licenses.map',          '© {0} -tekijät, lisenssi {1}. Karttakirjasto {2}.')
ON DUPLICATE KEY UPDATE value = VALUES(value);
