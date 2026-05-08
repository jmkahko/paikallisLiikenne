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
- **Fetch + GraphQL POST** oman PHP-proxyn (`/api/digitransit.php`) kautta
  — selain ei kutsu Digitransitia suoraan, eikä avain ole bundlessa.
- **PHP-proxy** (`public/api/digitransit.php`) lisää
  `digitransit-subscription-key`-headerin ja välittää GraphQL-pyynnön
  Digitransitiin. Asetukset (avain, endpoint, CORS-origin) luetaan
  ympäristömuuttujista tai fallbackina `public/api/config.php`-tiedostosta.
- **CORS-suojaus**: PHP-proxy hyväksyy vain pyynnöt, joiden `Origin`-header
  vastaa `ALLOWED_ORIGIN`-ympäristömuuttujaa. Estää ulkopuolisen
  väärinkäytön (esim. cURL, toisen sivuston JS).
- **localStorage** pysäkkivalintojen tallennukseen (`useLocalStorage`-hook).
- **Page Visibility API** (`visibilitychange`) pollingin pysäyttämiseen
  kun välilehti on piilossa.
- **Docker** (multi-stage: `node`-build → `php:8-apache`-runtime)
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
├── Dockerfile               # Multi-stage build → php:8-apache
├── docker-compose.yml       # `docker compose up` käynnistys
├── .dockerignore            # node_modules, dist, .env, config.php pois imageen
├── README.md                # Käyttäjäohjeet (asennus, API-avain, julkaisu)
├── CLAUDE.md                # Tämä tiedosto
├── public/
│   └── api/                     # Vite kopioi sellaisenaan dist/api/:hin
│       ├── digitransit.php      # Tuotannon PHP-proxy
│       ├── config.example.php   # Malli; käyttäjä luo config.php palvelimelle
│       └── .htaccess            # Estää config.php:n suoran latauksen
└── src/
    ├── main.jsx             # React-juuren bootstrap
    ├── App.jsx              # Sovelluksen päärakenne, tila, layout
    ├── styles.css           # Kaikki tyylit (CSS-muuttujat juuressa)
    ├── api/
    │   └── digitransit.js   # GraphQL-kutsut omaan /api/digitransit.php:hen
    ├── hooks/
    │   ├── useLocalStorage.js   # Yleinen localStorage-hook
    │   └── useDepartures.js     # Pollaa pysäkin lähtöjä, näkyvyystietoinen
    └── components/
        ├── StopSearch.jsx   # Pysäkkihaku (debounce 350 ms)
        └── StopCard.jsx     # Yhden pysäkin kortti + lähdöt
```

## Yleiset komennot

```bash
npm install        # asenna riippuvuudet
npm run dev        # dev-palvelin http://localhost:5173 (Vite-proxy hoitaa /api)
npm run build      # tuotantokäännös → dist/ (sis. dist/api/digitransit.php)
npm run preview    # esikatselu — HUOM: ei aja PHP:tä, /api ei toimi

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
| `ALLOWED_ORIGIN` | Kyllä | CORS: sallittu origin (esim. `http://localhost:8080`). |
| `DIGITRANSIT_ENDPOINT` | Kyllä | GraphQL-endpointin URL (esim. `https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/`). |

**Tuotanto (Docker):** `.env`-arvot annetaan containerille `environment:`-
kentän kautta `docker-compose.yml`:ssa. Apache lukee ne `PassEnv`:llä ja
PHP saa ne `getenv()`:lla. Oletusarvoja ei ole — kaikki luetaan `.env`:stä.

**Tuotanto (web-hotelli):** Joko ympäristömuuttujat (jos hosting tukee) tai
`public_html/api/config.php` luotu palvelimella. Tämä tiedosto luodaan
käsin, eikä se päädy git-repoon (`.gitignore`).

`.env`, `.env.local` ja `public/api/config.php` ovat kaikki gitignoroituja.

## Konventiot

- Käyttöliittymäteksti **suomeksi** (myös virheilmoitukset ja tooltipit).
- Tiedosto- ja muuttujanimet **englanniksi** (`stop`, `departures`).
- Tila päämäärässään lähimmässä järkevässä paikassa: globaalia storea ei ole.
  `App.jsx` omistaa pysäkkilistan, `StopCard` hoitaa oman pysäkkinsä haut.
- Verkkokutsut keskitettävä `src/api/digitransit.js`:ään. Älä tee `fetch`:iä
  komponenteista suoraan.
- Selain kutsuu **vain** omaa `/api/digitransit.php`-proxya, ei koskaan
  Digitransitia suoraan. Tämä koskee sekä tuotantoa että devia. Älä lisää
  `VITE_DIGITRANSIT_API_KEY`-tyyppisiä muuttujia takaisin.
- 30 sekunnin polling-väli on oletus. Jos sitä muutetaan, päivitä myös README.
- CSS-muuttujat määritellään `:root`:issa ja `prefers-color-scheme: light`
  -mediakyselyssä — käytä niitä uusissa tyyleissä `--bg`, `--text`, jne.
- Ei kirjastoja UI:hin (date-fns, lodash, MUI) ilman vahvaa perustelua.
- Pidetään yhden tiedoston / komponentin pituus alle ~200 riviä.

## Mitä päivittää, kun jotain muuttuu

Tämä on tärkein osa: pidä nämä tiedostot synkassa.

| Muutoksen tyyppi | Päivitä myös |
| ---------------- | ------------ |
| Uusi npm-riippuvuus tai version nosto | `package.json`, `package-lock.json` (auto), README-kohta "Tekninen yhteenveto" jos relevantti |
| Uusi ympäristömuuttuja | `.env.example`, README:n "Asennus"- ja "Julkaisu"-osiot, `docker-compose.yml` (`environment:`), `Dockerfile` (jos lisättävä `PassEnv`). **Älä koskaan lisää avaimia `VITE_`-prefixillä** — paljastuu selaimeen. |
| Uusi käyttäjälle näkyvä toiminto | README:n "Ominaisuudet"-lista; tarvittaessa "Pysäkkien lisääminen" |
| Polling-välin tai näkyvyyslogiikan muutos | README:n "Ominaisuudet" + "Tekninen yhteenveto" |
| Uusi komponentti tai tiedosto | Tämän CLAUDE.md:n "Hakemistorakenne" |
| Digitransit-päätepisteen URL muuttuu | `.env` (`DIGITRANSIT_ENDPOINT`), `config.example.php`. Ei kovakoodattu PHP:ssä, Vitessä tai docker-composessa. |
| Selainpuolen ENDPOINT muuttuu | `src/api/digitransit.js` (`ENDPOINT`-vakio), `vite.config.js`-proxy-polun avain ja PHP-tiedoston nimi `public/api/`:ssa pysyvät synkassa. |
| PHP-proxy lisää uusia kenttiä/headeria | Päivitä sekä `public/api/digitransit.php` **että** `vite.config.js`:n dev-proxy `headers`. |
| Maksimi pysäkkimäärä muuttuu | `App.jsx` (`MAX_STOPS`), README, tämä taulukko |
| `localStorage`-avaimen rikkova muutos | Nosta avaimen versionumeroa (`paikallis.stops.v1` → `v2`) ja `App.jsx`:n `STORAGE_KEY`. Mainitse README:ssä. |
| Uusi npm-skripti `package.json`:iin | README:n komennot, tämän tiedoston "Yleiset komennot" |
| Tyylimuutokset `:root`-muuttujiin | `src/styles.css` molemmat lohkot (tumma + light-media) |
| Uusi tiedosto `public/api/`:in | `.htaccess`-suojaus tarvittaessa, README "Julkaisu"-osio jos käyttäjän pitää tehdä jotain palvelimella |
| Docker-imageen tarvittava lisätyökalu | `Dockerfile` (apt-get install) **ja** README "Web-hotelli-simulaatio (Docker)" -osio |

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
- **PHP-proxyn testaus paikallisesti**: `npm run preview` ei aja PHP:tä,
  joten käytä `docker compose up --build` (8080) tai
  `php -S 0.0.0.0:8080 -t dist`.
- **`config.php` ei git-repoon**: tarkista `.gitignore` ennen committia
  että `public/api/config.php` ei näy `git status`:ssa.
- **Docker getenv()**: Apache+PHP ei oletuksena välitä container-tason
  env-muuttujia PHP-prosessille. `Dockerfile`:ssa on `PassEnv`-direktiivit
  (`DIGITRANSIT_API_KEY`, `ALLOWED_ORIGIN`, `DIGITRANSIT_ENDPOINT`) jotka
  mahdollistavat tämän. Jos lisäät uusia env-muuttujia, päivitä myös tuo lista.
- **Suluiden tasapaino**: ilman lintteriä JSX-virheet huomataan vasta
  käännöksessä. Aja `npm run build` ennen committia.

## Tekijä

Sovellus on toteutettu Claude-tekoälyllä keskustelun kautta — lue README:n
"Tekijä"-osio.
