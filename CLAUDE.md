# CLAUDE.md

Tämä tiedosto on muistilappu tekoälylle (ja kehittäjälle), joka työskentelee
tämän projektin parissa. Lue tämä **ennen** kuin teet muutoksia.

## Yleiskuvaus

Pieni React-sovellus, jolla seurataan Tampereen Nysse-pysäkkien
reaaliaikaisia bussi- ja raitiovaunulähtöjä. Käyttäjä voi lisätä enintään
6 pysäkkiä, jotka tallennetaan selaimen `localStorage`:een. Tiedot haetaan
Digitransit GraphQL-rajapinnasta (Waltti / Tampere) **palvelinpuolen
PHP-proxyn kautta**, jotta API-avain ei päädy selainbundleen.
Käyttöliittymän tekstit haetaan **MySQL-tietokannasta** (`/api/texts.php`).

Tuotanto-kohteena on tavallinen PHP- ja MySQL-tukeva web-hotelli.
Paikallisesti voi simuloida hostingia Dockerissa (`docker compose up`).

## Tekniikat

- **React 18** funktionaalisilla komponenteilla ja hookeilla.
- **Vite 5** dev-palvelin & build-työkalu.
- **Vanilla CSS** (`src/styles.css`). Ei Tailwindia, ei CSS-in-JS:ää.
- **Leaflet + react-leaflet** karttanäkymään (pysäkkien valinta kartalta).
  Karttalaatat **OpenStreetMapista** (julkiset, ei API-avainta) —
  attribuutio "© OpenStreetMap -tekijät" pakollinen. Pysäkit haetaan
  `stopsByBbox`-kyselyllä oman PHP-proxyn kautta, ei Digitransit-laattoja
  (jotta avain pysyy palvelimella).
- **Fetch + GraphQL POST** oman PHP-proxyn (`/api/digitransit.php`) kautta
  — selain ei kutsu Digitransitia suoraan, eikä avain ole bundlessa.
- **PHP-proxy** (`public/api/digitransit.php`, tuotannossa `public_html/api/digitransit.php`)
  lisää `digitransit-subscription-key`-headerin ja välittää GraphQL-pyynnön
  Digitransitiin. Asetukset (avain, endpoint, CORS-origin) luetaan
  ympäristömuuttujista tai fallbackina `config.php`-tiedostosta. Proxy etsii
  sen ensin web-rootin yläpuolelta (`dirname(__DIR__, 2)` →
  `/home/käyttäjä/config.php`, suositeltu) ja sitten omasta kansiostaan
  (`public_html/api/config.php`). Ympäristömuuttuja voittaa `config.php`:n.
- **Origin-tarkistus**: PHP-proxy hyväksyy vain pyynnöt, joiden `Origin`-header
  vastaa `ALLOWED_ORIGIN`-arvoa täsmälleen. Estää toisten sivustojen selain-JS:ää
  käyttämästä proxya. **Ei ole pääsynhallinta**: selaimen ulkopuolelta (cURL)
  `Origin`-headerin voi väärentää. Tyhjä arvo kytkee tarkistuksen pois.
- **localStorage** pysäkkivalintojen tallennukseen (`useLocalStorage`-hook).
- **Page Visibility API** (`visibilitychange`) pollingin pysäyttämiseen
  kun välilehti on piilossa.
- **Docker** (multi-stage: `node:20-alpine`-build → `php:8.2-apache`-runtime,
  `pdo_mysql` asennettuna, sekä erilliset palvelut `db` (`mysql:8.4`) ja
  `phpmyadmin` (`phpmyadmin:5.2`, vain `127.0.0.1:8081`))
  simuloi web-hotelliympäristöä paikallisesti. Ympäristömuuttujat
  välitetään runtime-enveinä (`environment:` docker-composessa, arvot
  `.env`-tiedostosta), ei build-argeina.
- **MySQL** käyttöliittymän teksteille (`public/api/texts.php`, PDO,
  `utf8mb4`). Taulut `ui_language`, `ui_text_key`, `ui_text` (`db/*.sql`).
  Kielet ovat rivejä, eivät sarakkeita. Komponentit hakevat tekstit
  `useText()`-hookilla: `t('ryhmä.avain', [arvo0, arvo1])`, jossa `{0}`, `{1}`
  korvataan arvoilla (luku, teksti tai React-elementti, esim. linkki).
  Puuttuva käännös → suomi; puuttuva avain → avain näkyy sellaisenaan.
  Ilman tietokantaa sovellus näyttää vain vikailmoituksen (`TextProvider`).
- Ei TypeScriptiä. Ei testikirjastoa. Ei lintteriä konfiguroituna.

Riippuvuudet näkyvät `package.json`:ssa. Pidä riippuvuusmäärä minimissä —
älä lisää kirjastoja ilman selkeää tarvetta.

## Hakemistorakenne

```
.
├── index.html               # Vite entry HTML
├── vite.config.js           # Vite-asetukset (portti 5173, dev-proxy)
├── package.json             # npm-skriptit & dependencies
├── .env.example             # Malli .env:stä (API_KEY, ALLOWED_ORIGIN, ENDPOINT)
├── Dockerfile               # Multi-stage build → php:8.2-apache
├── docker-compose.yml       # `docker compose up` käynnistys
├── .dockerignore            # node_modules, dist, .env, config.php pois imageen
├── .gitignore               # .env*, config.php (sekä juuressa että public/api/), dist
├── db/
│   ├── 01-schema.sql        # Taulut ui_language, ui_text_key, ui_text (utf8mb4) + kielet fi/en
│   ├── 02-texts-fi.sql      # Suomenkieliset tekstit + avainten selitteet; tiedosto voittaa (uudelleenajo päivittää kannan)
│   └── 03-texts-en.sql      # Englanninkieliset käännökset; tiedosto voittaa kuten 02
├── README.md                # Käyttäjäohjeet (asennus, API-avain, julkaisu, vianetsintä)
├── CHANGELOG.md             # Muutosloki (Keep a Changelog), kanoninen versiohistoria
├── CLAUDE.md                # Tämä tiedosto
├── public/
│   └── api/
│       ├── digitransit.php      # Tuotannon PHP-proxy
│       ├── texts.php            # Käyttöliittymän tekstit MySQL:stä (GET ?lang=fi, ETag)
│       ├── config-loader.php    # setting(): env-muuttuja tai config.php (yhteinen molemmille)
│       ├── config.example.php   # Malli; käyttäjä luo config.php web-rootin yläpuolelle
│       └── .htaccess            # Estää config.php:n, config-loaderin ja mallin latauksen (Apache 2.2 + 2.4)
└── src/
    ├── main.jsx             # React-juuren bootstrap
    ├── App.jsx              # Sovelluksen päärakenne, tila, layout
    ├── styles.css           # Kaikki tyylit (CSS-muuttujat juuressa)
    ├── changelog.js         # Versiotiedot About-modaaliin (versio, julkaisupäivä, CHANGELOG-linkki)
    ├── api/
    │   ├── digitransit.js   # GraphQL-kutsut omaan /api/digitransit.php:hen
    │   └── texts.js         # Käyttöliittymän tekstit omasta /api/texts.php:stä
    ├── i18n/
    │   └── texts.jsx        # TextProvider (lataus/vikailmoitus, kielen valinta), useText(), useLanguage(), formatText({0}, {1}…)
    ├── hooks/
    │   ├── useLocalStorage.js   # Yleinen localStorage-hook
    │   ├── useDepartures.js     # Pollaa pysäkin lähtöjä, näkyvyystietoinen
    │   ├── useAlerts.js         # Pollaa häiriötiedotteita (60 s) valitulla kielellä, näkyvyystietoinen
    │   ├── useStopRoutes.js     # Hakee valittujen pysäkkien reitit (tiedotekohdistus)
    │   └── useTrip.js           # Pollaa vuoron reittiä ja pysäkkiaikoja (30 s), näkyvyystietoinen
    └── components/
        ├── StopSearch.jsx     # Pysäkkihaku (debounce 350 ms)
        ├── StopMap.jsx        # Pysäkkien valinta kartalta (Leaflet + OSM-laatat)
        ├── TripModal.jsx      # Vuoronäkymä (aikataulurivi tai jaettu linkki → modaali): yhteenveto, Jaa, välilehdet
        ├── TripMap.jsx        # Vuoron reittiviiva + pysäkit + arvioitu sijainti (Kartta-välilehti)
        ├── TripTimetable.jsx  # Vuoron pysäkit ja ajat, jääpoispysäkin valinta (Aikataulu-välilehti)
        ├── TripShare.jsx      # Jaa-painike: jakovalikko → leikepöytä → käsin kopioitava kenttä
        ├── tripLink.js        # Jaettavan vuorolinkin (?trip=&date=&from=&to=) muodostus, luku ja viestiteksti
        ├── tripProgress.js    # Vuoron arvioitu eteneminen pysäkkien aikatauluajoista (ei GPS) + aika-apurit
        ├── mapShared.js       # Jaetut karttatyökalut (OSM-laatat, divIcon-ikonit)
        ├── StopCard.jsx       # Yhden pysäkin kortti + lähdöt
        ├── Alerts.jsx         # Häiriötiedotteet: avattava paneeli + "kaikki"-modaali
        ├── LanguageSwitch.jsx # Kielivalinta FI | EN otsikkorivillä (näkyy, kun käytössä on useampi kieli)
        ├── PrivacyBanner.jsx  # Tietosuojailmoitus (localStorage-tieto)
        └── About.jsx          # About-modale (tiedot, lisenssi, vastuuvapautus)
```

**Web-hotellissa:**

```
/home/käyttäjä/
├── config.php               ← asetukset (web-rootin yläpuolella, turvassa; luodaan käsin)
└── public_html/             ← web-root = dist/:n sisältö
    ├── index.html
    ├── assets/
    └── api/
        ├── digitransit.php      ← PHP-proxy
        ├── texts.php            ← tekstit MySQL:stä
        ├── config-loader.php    ← asetusten luku
        ├── config.example.php   ← malli
        └── .htaccess            ← estää config.php:n, config-loaderin ja mallin latauksen
```

Vaihtoehtoisesti `config.php` voi olla `public_html/api/`-kansiossa, jos
hosting ei salli tiedostoja web-rootin yläpuolella.

## Yleiset komennot

```bash
npm install        # asenna riippuvuudet
npm run dev        # dev-palvelin http://localhost:5173 (Vite-proxy hoitaa /api;
                   # tekstit Dockerista → `docker compose up -d` oltava käynnissä)
npm run build      # tuotantokäännös → dist/ (sis. dist/api/digitransit.php)
npm run preview    # esikatselu http://localhost:4173 — /api Vite-proxyn kautta, EI aja PHP:tä

# Web-hotelli-simulaatio (Apache + PHP 8):
docker compose up --build   # http://localhost:8080, phpMyAdmin http://localhost:8081
docker compose down         # sammuta
docker compose down -v      # sammuta ja nollaa MySQL (db/*.sql ajetaan uudelleen)
```

**Dev:** Asetukset syötetään tiedostoon `.env` (EI `VITE_`-prefixiä →
ei selainbundleen). Vite-dev-palvelin lukee ne `loadEnv`:llä.

**Ympäristömuuttujat:**

| Muuttuja | Pakollinen | Kuvaus |
| -------- | ---------- | ------ |
| `DIGITRANSIT_API_KEY` | Kyllä | Digitransit-rajapinnan subscription key |
| `ALLOWED_ORIGIN` | Tuotannossa kyllä | Sallittu origin (esim. `http://localhost:8080`). Tyhjä = tarkistus pois. Dev (Vite-proxy) ei käytä. |
| `DIGITRANSIT_ENDPOINT` | Kyllä | GraphQL-endpointin URL (esim. `https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/`). Devissä ilman tätä Vite ei luo proxya. |
| `DB_HOST` | Kyllä (ei `.env`:ssä) | MySQL-palvelin. Dockerissa kiinteästi `db` (`docker-compose.yml`), web-hotellissa yleensä `localhost`. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Kyllä | Tekstitietokanta. Docker luo kannan ja käyttäjän näillä ensimmäisellä käynnistyksellä. Tuotannossa käyttäjälle riittää SELECT. |

**Tuotanto (Docker):** `.env`-arvot annetaan containerille `environment:`-
kentän kautta `docker-compose.yml`:ssa. Apache lukee ne `PassEnv`:llä ja
PHP saa ne `getenv()`:lla. Oletusarvoja ei ole — kaikki luetaan `.env`:stä.

**Tuotanto (web-hotelli):** Joko ympäristömuuttujat (jos hosting tukee) tai
`config.php` luotu web-hotellin juureen (`/home/käyttäjä/config.php`, eli
`public_html`:n yläpuolelle) tai `public_html/api/`-kansioon. Proxy etsii
molemmista automaattisesti — `digitransit.php`:tä ei muokata käsin. Tiedosto
luodaan käsin palvelimella, eikä se päädy git-repoon (`.gitignore`).
Yläpuolella sijainti suojaa API-avaimen myös, jos `.htaccess` ei toimisi.

`.env`, `.env.local` ja `config.php` (repon juuressa ja `public/api/`:ssa)
ovat kaikki gitignoroituja.

## Konventiot

- Käyttöliittymäteksti on tietokannassa (myös virheilmoitukset ja tooltipit);
  pääkieli **suomi**, englanti käännöksenä.
- Tiedosto- ja muuttujanimet **englanniksi** (`stop`, `departures`).
- Tila päämäärässään lähimmässä järkevässä paikassa: globaalia storea ei ole.
  `App.jsx` omistaa pysäkkilistan, `StopCard` hoitaa oman pysäkkinsä haut.
- **Käyttöliittymätekstejä ei kovakoodata**: lisää ne `db/02-texts-fi.sql`:ään
  (`ui_text_key` + `ui_text`, paikanpitimet selitetään `note`-sarakkeessa) ja
  käytä koodissa `t('ryhmä.avain')`. Tiedosto on suomen tekstien virallinen
  lähde: korjaus tehdään suoraan riviin (ei erillisiä UPDATE-lauseita), ja
  uudelleenajo (`ON DUPLICATE KEY UPDATE … VALUES()`) päivittää kannan.
  Ryhmä on näkymä (`app`, `stopCard`, `trip`…) tai yhteinen `common`. Linkkien osoitteet pysyvät koodissa,
  vain linkkiteksti on kannassa. Ainoa poikkeus on `TextProvider`in
  vikailmoitus (fi + en), koska se näytetään juuri kun kanta ei vastaa.
  Lisää uudelle tekstille käännös myös `db/03-texts-en.sql`:ään (muuten
  englanniksi näkyy suomi). Kellonajat ja päivämäärät muotoillaan
  `useLanguage().locale`-arvolla — älä kovakoodaa `'fi-FI'`:tä. Tiedostot,
  jotka eivät ole komponentteja (esim. `tripLink.js`), saavat `t`:n ja
  `locale`n parametreina.
- Verkkokutsut keskitettävä `src/api/`-kansioon (`digitransit.js`,
  `texts.js`). Älä tee `fetch`:iä
  komponenteista suoraan.
- Selain kutsuu Digitransit-tietoja varten **vain** omaa
  `/api/digitransit.php`-proxya, ei koskaan Digitransitia suoraan. Tämä koskee
  sekä tuotantoa että devia. Älä lisää `VITE_DIGITRANSIT_API_KEY`-tyyppisiä
  muuttujia takaisin. Ainoa muu ulkoinen palvelu, johon selain ottaa yhteyttä,
  on OpenStreetMapin laattapalvelin (mainittu tietosuojateksteissä).
- 30 sekunnin polling-väli on oletus. Jos sitä muutetaan, päivitä myös README.
- CSS-muuttujat määritellään `:root`:issa ja `prefers-color-scheme: light`
  -mediakyselyssä — käytä niitä uusissa tyyleissä `--bg`, `--text`, jne.
- Ei kirjastoja UI:hin (date-fns, lodash, MUI) ilman vahvaa perustelua.
- Pidetään yhden komponentin tai hookin pituus alle ~200 riviä. Poikkeuksia
  ovat `src/styles.css` (kaikki tyylit yhdessä) ja `src/api/digitransit.js`
  (kaikki GraphQL-kyselyt yhdessä) — pidä ne silti jäsenneltyinä.

## Mitä päivittää, kun jotain muuttuu

Tämä on tärkein osa: pidä nämä tiedostot synkassa.

| Muutoksen tyyppi | Päivitä myös |
| ---------------- | ------------ |
| Uusi npm-riippuvuus tai version nosto | `package.json`, `package-lock.json` (auto), README-kohta "Tekninen yhteenveto" jos relevantti |
| Uusi ympäristömuuttuja | `.env.example`, README:n "Asennus"- ja "Julkaisu"-osiot, `docker-compose.yml` (`environment:`), `Dockerfile` (jos lisättävä `PassEnv`). **Älä koskaan lisää avaimia `VITE_`-prefixillä** — paljastuu selaimeen. |
| Uusi käyttäjälle näkyvä toiminto | README:n "Ominaisuudet"-lista; tarvittaessa "Pysäkkien lisääminen" |
| Polling-välin tai näkyvyyslogiikan muutos | README:n "Ominaisuudet" + "Tekninen yhteenveto", teksti `about.data.source` (mainitsee 30 s) `db/02-texts-fi.sql`:ssä ja `db/03-texts-en.sql`:ssä |
| Selain ottaa yhteyttä uuteen ulkoiseen palveluun (laatat, fontit, CDN…) | Tietosuojatekstit `privacy.text` ja `about.privacy.*` (`db/02-texts-fi.sql`, `db/03-texts-en.sql`) ja README:n "Tietosuoja ja tietoturva" |
| Proxyyn uusi virheilmoitus tai asetus | README:n "Vianetsintä"-taulukko |
| Uusi komponentti tai tiedosto | Tämän CLAUDE.md:n "Hakemistorakenne" |
| About-sivu tai modal-sisältö muuttuu | Tekstit `about.*` (`db/02-texts-fi.sql`, `db/03-texts-en.sql`), rakenne ja linkit `src/components/About.jsx`, `src/styles.css` (modal-tyylit), README:n "Ominaisuudet" jos relevantti |
| Uusi julkaisu / versionnosto | `CHANGELOG.md` (kanoninen muutosloki), `src/changelog.js` (`APP_VERSION` + `APP_RELEASE_DATE`), `package.json` `version`. Pidä versionumero samana kaikissa kolmessa ja luo vastaava git-tagi (`vX.Y`). |
| Digitransit-päätepisteen URL muuttuu | `.env` (`DIGITRANSIT_ENDPOINT`), `config.example.php`. Ei kovakoodattu PHP:ssä, Vitessä tai docker-composessa. |
| Selainpuolen ENDPOINT muuttuu | `src/api/digitransit.js` (`ENDPOINT`-vakio), `vite.config.js`-proxy-polun avain ja PHP-tiedoston sijainti (`public/api/digitransit.php`) pysyvät synkassa. |
| PHP-proxy lisää uusia kenttiä/headeria | Päivitä sekä `public/api/digitransit.php` **että** `vite.config.js`:n dev-proxy `headers`. |
| Maksimi pysäkkimäärä muuttuu | `App.jsx` (`MAX_STOPS`), README, tämä taulukko |
| `localStorage`-avaimen rikkova muutos | Nosta avaimen versionumeroa (esim. `paikallis.stops.v1` → `v2`). Avaimet: `paikallis.stops.v1` ja `paikallis.departureCount.v1` (`App.jsx`: `STORAGE_KEY`, `DEPARTURE_COUNT_KEY`), `paikallis.privacy.v1` (`PrivacyBanner.jsx`: `PRIVACY_KEY`), `paikallis.lang.v1` (`src/i18n/texts.jsx`: `LANG_KEY`, raakamerkkijono, tallennetaan vain käyttäjän valitessa kielen). Mainitse README:ssä. |
| Uusi npm-skripti `package.json`:iin | README:n komennot, tämän tiedoston "Yleiset komennot" |
| Tyylimuutokset `:root`-muuttujiin | `src/styles.css` molemmat lohkot (tumma + light-media) |
| Uusi tai muuttuva käyttöliittymäteksti | `db/02-texts-fi.sql` (avain `ui_text_key` + teksti `ui_text`, `note` paikanpitimille), käännös `db/03-texts-en.sql`, koodissa `t('ryhmä.avain')`. Ei kovakoodattuja tekstejä. Web-hotellin kantaan ajo mainitaan julkaisussa. |
| Tietokantaskeema muuttuu | `db/01-schema.sql` (`CREATE TABLE IF NOT EXISTS`), README "Julkaisu"-osio (miten olemassa olevaa kantaa päivitetään), `texts.php` |
| Uusi tiedosto `public/api/`:in | `.htaccess`-suojaus tarvittaessa, README "Julkaisu"-osio jos käyttäjän pitää tehdä jotain palvelimella |
| Docker-imageen tarvittava lisätyökalu | `Dockerfile` (apt-get install) **ja** README "Web-hotelli-simulaatio (Docker)" -osio |

## Julkaisukäytäntö

Versio tehdään **useammasta korjauksesta/issuesta kerralla** — älä luo omaa
versiota jokaisesta yksittäisestä issuesta. Kerää valmiit muutokset
`CHANGELOG.md`:n `[Ei julkaistu]`-osioon, ja kun kasassa on mielekäs kokonaisuus,
nosta versio. Yksittäiset issuet voi mainita versiomerkinnän kohdalla
(esim. `([#7])`), mutta ne eivät kukin ansaitse omaa julkaisuaan.

**Versionnoston vaiheet** (omassa `release-vX.Y.Z`-haarassa + PR, squash-merge):

1. Siirrä `CHANGELOG.md`:n `[Ei julkaistu]` → `[X.Y.Z] - PVM` ja päivitä
   compare-linkit. Jätä tyhjä `[Ei julkaistu]` tulevalle.
2. Päivitä `src/changelog.js` (`APP_VERSION` + `APP_RELEASE_DATE`) ja
   `package.json` `version`.
3. Mergen jälkeen: luo annotoitu git-tagi `vX.Y` mainiin ja pushaa se.
4. Tee GitHub Release tagista:
   `gh release create vX.Y --verify-tag --title "vX.Y.Z" --notes <CHANGELOG-osio>`.

Git-haarat poistetaan mergen jälkeen (squash-PR, `--delete-branch`).

## Yleisiä sudenkuoppia

- **GraphQL-skeema**: Digitransit v2 ei tue kaikkia v1:n argumentteja
  (esim. `stops(maxResults: ...)` ei toimi). Validoi kenttä-argumentit
  Digitransit-portaalin GraphiQL:llä ennen julkaisua. `Trip.stoptimesForDate`
  on vanhentunut — vuoron ajat haetaan `trip.onServiceDate(date: "YYYY-MM-DD")
  { stopCalls … }`, joka palauttaa ISO-aikaleimat (aikataulu + reaaliaika).
- **Service day -aikalaskenta**: `stoptimesWithoutPatterns` palauttaa ajat
  sekunteina `serviceDay`:n päälle. Älä unohda kertoa 1000:lla muunnoksessa
  `Date`-objektiksi (`(serviceDay + secs) * 1000`).
- **localStorage SSR**: Tätä sovellusta ei renderöidä palvelimella, joten
  suora `window.localStorage` on ok. Jos siirrytään SSR:ään, lisää `typeof
  window` -tarkistus.
- **API-avaimen vuotaminen**: Vite paistaa kaikki `VITE_`-alkuiset
  ympäristömuuttujat selainbundleen. Siksi tässä projektissa avain
  käyttää muuttujanimeä `DIGITRANSIT_API_KEY` (ilman prefixiä) ja
  Vite-dev-palvelin lukee sen `loadEnv`:lla. **Älä koskaan käytä
  `VITE_DIGITRANSIT_API_KEY`-nimeä** — se paljastaisi avaimen.
- **PHP-proxyn testaus paikallisesti**: kumpikaan `npm run dev` tai
  `npm run preview` ei aja PHP:tä — molemmat käyttävät Vite-proxya (`preview.proxy` perii
  `server.proxy`:n), joten `digitransit.php`:n muutokset ja origin-tarkistus
  jäävät niissä testaamatta. Käytä `docker compose up --build` (8080) tai
  `php -S 0.0.0.0:8080 -t dist` (jälkimmäinen tarvitsee env-muuttujat tai
  repon juureen `config.php`:n, koska proxy etsii sen `dist/`:n yläpuolelta).
- **`config.php` ei git-repoon**: tarkista `.gitignore` ennen committia
  että `config.php` ei näy `git status`:ssa. Web-hotellissa se luodaan
  palvelimella web-rootin yläpuolelle (`/home/käyttäjä/config.php`).
- **Docker getenv()**: Apache+PHP ei oletuksena välitä container-tason
  env-muuttujia PHP-prosessille. `Dockerfile`:ssa on `PassEnv`-direktiivit
  (`DIGITRANSIT_API_KEY`, `ALLOWED_ORIGIN`, `DIGITRANSIT_ENDPOINT`, `DB_*`) jotka
  mahdollistavat tämän. Jos lisäät uusia env-muuttujia, päivitä myös tuo lista.
- **MySQL init vain kerran**: Docker ajaa `db/*.sql`:t vain, kun
  `db-data`-volume on tyhjä; `up --build` ei päivitä tekstejä, vaan uudet
  näkyvät avaimina. Aja tiedostot uudelleen (README:n Docker-osion
  `for f in db/0*.sql …` -komento tai phpMyAdmin) tai `docker compose down -v`.
- **Ääkköset MySQL:ssä**: SQL-tiedostot alkavat `SET NAMES utf8mb4;` ja
  PDO-yhteydessä on `charset=utf8mb4`. Muokkaa mieluiten phpMyAdminilla
  (localhost:8081). Containerin `mysql`-komentorivi käyttää
  oletuksena `latin1`:tä — käytä `--default-character-set=utf8mb4`, muuten
  ääkköset tallentuvat kahdesti koodattuina (`Ã¤`).
- **Dev tarvitsee Dockerin**: `npm run dev`/`preview` ohjaa
  `/api/texts.php`:n `localhost:8080`:aan. Vanha, ennen tätä muutosta rakennettu
  container antaa 404 → `docker compose up --build`.
- **Suluiden tasapaino**: ilman lintteriä JSX-virheet huomataan vasta
  käännöksessä. Aja `npm run build` ennen committia.

## Tekijä

Sovellus on toteutettu Claude-tekoälyllä keskustelun kautta — lue README:n
"Tekijä"-osio.
