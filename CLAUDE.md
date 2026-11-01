# CLAUDE.md

Tämä tiedosto on muistilappu tekoälylle (ja kehittäjälle), joka työskentelee
tämän projektin parissa. Lue tämä **ennen** kuin teet muutoksia.

## Yleiskuvaus

Pieni React-sovellus, jolla seurataan Tampereen Nysse-pysäkkien
reaaliaikaisia bussi- ja raitiovaunulähtöjä. Käyttäjä voi lisätä enintään
6 pysäkkiä, jotka tallennetaan selaimen `localStorage`:een. Tiedot haetaan
Digitransit GraphQL-rajapinnasta (Waltti / Tampere) **palvelinpuolen
PHP-proxyn kautta**, jotta API-avain ei päädy selainbundleen.

Tuotanto-kohteena on tavallinen PHP-tukeva web-hotelli.
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
- **Docker** (multi-stage: `node:20-alpine`-build → `php:8.2-apache`-runtime)
  simuloi web-hotelliympäristöä paikallisesti. Ympäristömuuttujat
  välitetään runtime-enveinä (`environment:` docker-composessa, arvot
  `.env`-tiedostosta), ei build-argeina.
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
├── README.md                # Käyttäjäohjeet (asennus, API-avain, julkaisu, vianetsintä)
├── CHANGELOG.md             # Muutosloki (Keep a Changelog), kanoninen versiohistoria
├── CLAUDE.md                # Tämä tiedosto
├── public/
│   └── api/
│       ├── digitransit.php      # Tuotannon PHP-proxy
│       ├── config.example.php   # Malli; käyttäjä luo config.php web-rootin yläpuolelle
│       └── .htaccess            # Estää config.php:n ja mallin latauksen (Apache 2.2 + 2.4)
└── src/
    ├── main.jsx             # React-juuren bootstrap
    ├── App.jsx              # Sovelluksen päärakenne, tila, layout
    ├── styles.css           # Kaikki tyylit (CSS-muuttujat juuressa)
    ├── changelog.js         # Versiotiedot About-modaaliin (versio, julkaisupäivä, CHANGELOG-linkki)
    ├── api/
    │   └── digitransit.js   # GraphQL-kutsut omaan /api/digitransit.php:hen
    ├── hooks/
    │   ├── useLocalStorage.js   # Yleinen localStorage-hook
    │   ├── useDepartures.js     # Pollaa pysäkin lähtöjä, näkyvyystietoinen
    │   ├── useAlerts.js         # Pollaa häiriötiedotteita (60 s), näkyvyystietoinen
    │   └── useStopRoutes.js     # Hakee valittujen pysäkkien reitit (tiedotekohdistus)
    └── components/
        ├── StopSearch.jsx     # Pysäkkihaku (debounce 350 ms)
        ├── StopMap.jsx        # Pysäkkien valinta kartalta (Leaflet + OSM-laatat)
        ├── TripMap.jsx        # Vuoron reittiviiva + pysäkit + arvioitu sijainti (aikataulurivi → modaali)
        ├── tripProgress.js    # Vuoron arvioitu eteneminen pysäkkien aikatauluajoista (ei GPS)
        ├── mapShared.js       # Jaetut karttatyökalut (OSM-laatat, divIcon-ikonit)
        ├── StopCard.jsx       # Yhden pysäkin kortti + lähdöt
        ├── Alerts.jsx         # Häiriötiedotteet: avattava paneeli + "kaikki"-modaali
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
        ├── config.example.php   ← malli
        └── .htaccess            ← estää config.php:n ja mallin latauksen
```

Vaihtoehtoisesti `config.php` voi olla `public_html/api/`-kansiossa, jos
hosting ei salli tiedostoja web-rootin yläpuolella.

## Yleiset komennot

```bash
npm install        # asenna riippuvuudet
npm run dev        # dev-palvelin http://localhost:5173 (Vite-proxy hoitaa /api)
npm run build      # tuotantokäännös → dist/ (sis. dist/api/digitransit.php)
npm run preview    # esikatselu http://localhost:4173 — /api Vite-proxyn kautta, EI aja PHP:tä

# Web-hotelli-simulaatio (Apache + PHP 8):
docker compose up --build   # http://localhost:8080
docker compose down         # sammuta
```

**Dev:** Asetukset syötetään tiedostoon `.env` (EI `VITE_`-prefixiä →
ei selainbundleen). Vite-dev-palvelin lukee ne `loadEnv`:llä.

**Ympäristömuuttujat:**

| Muuttuja | Pakollinen | Kuvaus |
| -------- | ---------- | ------ |
| `DIGITRANSIT_API_KEY` | Kyllä | Digitransit-rajapinnan subscription key |
| `ALLOWED_ORIGIN` | Tuotannossa kyllä | Sallittu origin (esim. `http://localhost:8080`). Tyhjä = tarkistus pois. Dev (Vite-proxy) ei käytä. |
| `DIGITRANSIT_ENDPOINT` | Kyllä | GraphQL-endpointin URL (esim. `https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/`). Devissä ilman tätä Vite ei luo proxya. |

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

- Käyttöliittymäteksti **suomeksi** (myös virheilmoitukset ja tooltipit).
- Tiedosto- ja muuttujanimet **englanniksi** (`stop`, `departures`).
- Tila päämäärässään lähimmässä järkevässä paikassa: globaalia storea ei ole.
  `App.jsx` omistaa pysäkkilistan, `StopCard` hoitaa oman pysäkkinsä haut.
- Verkkokutsut keskitettävä `src/api/digitransit.js`:ään. Älä tee `fetch`:iä
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
| Polling-välin tai näkyvyyslogiikan muutos | README:n "Ominaisuudet" + "Tekninen yhteenveto", `About.jsx` (mainitsee 30 s) |
| Selain ottaa yhteyttä uuteen ulkoiseen palveluun (laatat, fontit, CDN…) | Tietosuojatekstit: `PrivacyBanner.jsx`, `About.jsx` ja README:n "Tietosuoja ja tietoturva" |
| Proxyyn uusi virheilmoitus tai asetus | README:n "Vianetsintä"-taulukko |
| Uusi komponentti tai tiedosto | Tämän CLAUDE.md:n "Hakemistorakenne" |
| About-sivu tai modal-sisältö muuttuu | `src/components/About.jsx` (sisältö), `src/styles.css` (modal-tyylit), README:n "Ominaisuudet" jos relevantti |
| Uusi julkaisu / versionnosto | `CHANGELOG.md` (kanoninen muutosloki), `src/changelog.js` (`APP_VERSION` + `APP_RELEASE_DATE`), `package.json` `version`. Pidä versionumero samana kaikissa kolmessa ja luo vastaava git-tagi (`vX.Y`). |
| Digitransit-päätepisteen URL muuttuu | `.env` (`DIGITRANSIT_ENDPOINT`), `config.example.php`. Ei kovakoodattu PHP:ssä, Vitessä tai docker-composessa. |
| Selainpuolen ENDPOINT muuttuu | `src/api/digitransit.js` (`ENDPOINT`-vakio), `vite.config.js`-proxy-polun avain ja PHP-tiedoston sijainti (`public/api/digitransit.php`) pysyvät synkassa. |
| PHP-proxy lisää uusia kenttiä/headeria | Päivitä sekä `public/api/digitransit.php` **että** `vite.config.js`:n dev-proxy `headers`. |
| Maksimi pysäkkimäärä muuttuu | `App.jsx` (`MAX_STOPS`), README, tämä taulukko |
| `localStorage`-avaimen rikkova muutos | Nosta avaimen versionumeroa (esim. `paikallis.stops.v1` → `v2`). Avaimet: `paikallis.stops.v1` ja `paikallis.departureCount.v1` (`App.jsx`: `STORAGE_KEY`, `DEPARTURE_COUNT_KEY`), `paikallis.privacy.v1` (`PrivacyBanner.jsx`: `PRIVACY_KEY`). Mainitse README:ssä. |
| Uusi npm-skripti `package.json`:iin | README:n komennot, tämän tiedoston "Yleiset komennot" |
| Tyylimuutokset `:root`-muuttujiin | `src/styles.css` molemmat lohkot (tumma + light-media) |
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
  Digitransit-portaalin GraphiQL:llä ennen julkaisua.
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
  (`DIGITRANSIT_API_KEY`, `ALLOWED_ORIGIN`, `DIGITRANSIT_ENDPOINT`) jotka
  mahdollistavat tämän. Jos lisäät uusia env-muuttujia, päivitä myös tuo lista.
- **Suluiden tasapaino**: ilman lintteriä JSX-virheet huomataan vasta
  käännöksessä. Aja `npm run build` ennen committia.

## Tekijä

Sovellus on toteutettu Claude-tekoälyllä keskustelun kautta — lue README:n
"Tekijä"-osio.
