# Paikallisliikenne — Nysse pysäkit

Yksinkertainen React-sovellus, jolla voit seurata Tampereen Nysse-pysäkkien
seuraavia bussi- ja raitiovaunulähtöjä reaaliaikaisesti. Voit lisätä jopa
**6 pysäkkiä** ja sovellus muistaa valintasi selaimen `localStorage`:ssa.

Tiedot haetaan [Digitransit](https://digitransit.fi/) GraphQL-rajapinnasta
(Waltti / Tampere) **PHP-proxyn kautta**, joka pitää API-avaimen palvelimella.

**Sisällys:**
[Ominaisuudet](#ominaisuudet) ·
[Pysäkkien lisääminen](#pysäkkien-lisääminen) ·
[Tietosuoja ja tietoturva](#tietosuoja-ja-tietoturva) ·
[API-avaimen hankinta](#api-avaimen-hankinta) ·
[Asennus ja kehitys](#asennus-ja-kehitys) ·
[Web-hotelli-simulaatio (Docker)](#web-hotelli-simulaatio-docker) ·
[Julkaisu web-hotellille](#julkaisu-web-hotellille) ·
[Vianetsintä](#vianetsintä) ·
[Tekninen yhteenveto](#tekninen-yhteenveto) ·
[Lisenssi & lähteet](#lisenssi--lähteet)

## Ominaisuudet

- Pysäkkihaku nimellä tai pysäkkikoodilla.
- **Pysäkkien valinta kartalta** — pysäkin lisäyksessä on "Haku"- ja
  "Kartta"-välilehdet. Karttavälilehdellä (OpenStreetMap) näkyvälle alueelle
  latautuvat pysäkit, ja pysäkin lisää klikkaamalla sen markkeria. Bussi- ja
  raitiovaunupysäkit erottuvat väreillä.
- Jopa 6 pysäkkiä rinnakkain. Pysäkit tallennetaan selaimeen.
- Seuraavat lähdöt per pysäkki: linja, määränpää, lähtöaika ja "min"-laskuri.
  Näytettävien lähtöjen määrän (1–5) voi valita itse — kätevää kapealla
  puhelimen näytöllä. Valinta tallennetaan selaimeen.
- **Vuoron reitti kartalla** — klikkaamalla aikatauluriviä avautuu kartta,
  jossa näkyy linjan reittiviiva, pysäkit, lähtö/määränpää ja ajosuunta. Oma
  pysäkki on korostettu. Matkalla olevasta vuorosta näytetään myös **arvioitu
  sijainti**. Huomaa: sijainti on **pelkkä arvio aikataulun perusteella** (miltä
  pysäkiltä vuoro on viimeksi lähtenyt ja milloin) — se **ei perustu ajoneuvon
  GPS-sijaintiin**, eikä sitä tule käyttää luotettavana tietona vaunun
  todellisesta sijainnista.
- Reaaliaikamerkki (vihreä piste) kun aikataulutieto on liikenteen GPS:stä.
- Automaattinen päivitys 30 sekunnin välein. Manuaalinen päivitys napilla.
- Polling pysähtyy, kun välilehti ei ole näkyvissä (Page Visibility API),
  ja päivittyy heti kun välilehti palaa eteen — säästää API-kiintiötä.
- Bussit (sininen) ja raitiovaunut (punainen) erottuvat värillä.
- Vaalea/tumma teema seuraa järjestelmäasetusta.
- **Häiriötiedotteet** — avattava paneeli näyttää valitsemiisi pysäkkeihin
  vaikuttavat häiriöt. Mukaan tulevat myös reittikohtaiset tiedotteet (esim.
  "raitiovaunu 1"), jos kyseinen linja pysähtyy jollakin valitulla pysäkillä,
  sekä koko verkkoa koskevat tiedotteet. Tiedotteessa näkyvät sitä koskevat
  linjat. "Näytä kaikki" -modaalista näkee kaikki Tampereen tiedotteet.
  Päivittyy automaattisesti noin minuutin välein.
- **Tietosuojailmoitus** — kertoo ensimmäisellä kerralla, mitä sovellus
  tallentaa ja mihin se ottaa yhteyttä (ks.
  [Tietosuoja ja tietoturva](#tietosuoja-ja-tietoturva)). Ilmoituksen voi
  sulkea ja valinta muistetaan.
- **About-sivu** — modaali, jossa tiedot sovelluksesta, lisenssistä, Digitransitista
  ja vastuuvapautus. Avataan ℹ️-napilla oikeassa yläkulmassa.
- **Versiotieto** — About-ikkunassa näkyy käytössä oleva versio ja julkaisupäivä
  sekä linkki täyteen versiohistoriaan: [`CHANGELOG.md`](CHANGELOG.md).

## Pysäkkien lisääminen

1. **Haku-välilehdellä** hae pysäkki nimellä (esim. `Keskustori`, `Hervanta`)
   tai pysäkkikoodilla (esim. `0501`) ja klikkaa hakutulosta. Hakuun
   tarvitaan vähintään 2 merkkiä.
2. **Kartta-välilehdellä** selaa karttaa: zoomaa lähemmäs, niin näkyvälle
   alueelle ilmestyvät pysäkit, ja lisää pysäkki klikkaamalla markkeria →
   "Lisää pysäkki".
3. Lisätty pysäkki ilmestyy alas omaan korttiin.
4. Korttien painikkeilla voit järjestää (↑/↓), päivittää (↻) tai poistaa (✕).
5. Kun olet lisännyt 6 pysäkkiä, lisäys lukkiutuu kunnes poistat jonkin.

Pysäkkivalintasi tallennetaan automaattisesti selaimeen — ne säilyvät
sivulatausten yli.

## Tietosuoja ja tietoturva

- **Selaimeen tallennetaan** vain pysäkkivalinnat, näytettävien lähtöjen
  määrä ja tieto tietosuojailmoituksen kuittaamisesta (`localStorage`).
  Evästeitä tai analytiikkaa ei käytetä.
- **Pysäkki- ja aikataulutiedot** haetaan oman palvelimen PHP-proxyn kautta;
  selain ei ota yhteyttä Digitransitiin suoraan.
- **Karttakuvat** (laatat) ladataan suoraan OpenStreetMapin palvelimelta, kun
  karttaa käytetään. OpenStreetMap näkee tällöin käyttäjän IP-osoitteen ja
  katsotun kartta-alueen.
- **API-avain pysyy palvelimella** — selaimessa ei ole avainta missään
  vaiheessa. PHP-proxy lisää avaimen ja välittää GraphQL-kutsut Digitransitiin.
- **Origin-tarkistus** — proxy hyväksyy vain pyynnöt, joiden `Origin`-header
  vastaa `ALLOWED_ORIGIN`-asetusta. Tämä estää muita sivustoja käyttämästä
  proxyasi selaimesta (ja kuluttamasta API-kiintiötäsi). Huomaa, ettei
  tarkistus ole pääsynhallinta: selaimen ulkopuolelta (esim. cURL) `Origin`-
  headerin voi asettaa mielivaltaisesti. Jos `ALLOWED_ORIGIN` on tyhjä,
  tarkistus on pois päältä — aseta se aina tuotannossa.

## API-avaimen hankinta

Digitransit vaatii ilmaisen subscription keyn.

1. Mene osoitteeseen <https://portal-api.digitransit.fi/>.
2. Rekisteröidy / kirjaudu sisään.
3. Tilaa **Routing API** -tuote (riittää ilmainen taso).
4. Kopioi avaimesi. Avain näyttää 32 merkin heksamerkkijonolta.

## Asennus ja kehitys

Tarvitset [Node.js 20+](https://nodejs.org/).

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Luo .env-tiedosto asetuksilla
cp .env.example .env
# avaa .env ja täytä arvot:
#   DIGITRANSIT_API_KEY=oma-avaimesi
#   DIGITRANSIT_ENDPOINT=https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/
#   ALLOWED_ORIGIN=http://localhost:8080
# (HUOM: muuttujissa EI ole VITE_-prefixiä — arvot eivät mene selainbundleen.)

# 3. Käynnistä kehityspalvelin
npm run dev
```

Sovellus avautuu osoitteessa <http://localhost:5173>. Vite-dev-palvelin
proxyttää `/api/digitransit.php` -kutsut suoraan Digitransitiin ja lisää
avaimen palvelinpuolella, joten avain pysyy palvelimella myös devissä.

Dev-tilassa PHP:tä ei ajeta, joten `ALLOWED_ORIGIN`-tarkistustakaan ei tehdä —
arvoa käytetään vasta Dockerissa ja web-hotellissa. `DIGITRANSIT_ENDPOINT` on
devissä pakollinen: ilman sitä Vite ei luo proxya.

### Tuotantokäännös ja esikatselu

```bash
npm run build      # luo dist/-kansion (sis. dist/api/digitransit.php)
npm run preview    # esikatselu osoitteessa http://localhost:4173
```

`npm run preview` käyttää samaa Vite-proxya kuin `npm run dev`, joten `/api`
toimii, mutta **PHP-proxya ei ajeta**. Kun haluat testata PHP-proxyn
(esim. `digitransit.php`:n muutokset tai origin-tarkistuksen), käytä
[Dockeria](#web-hotelli-simulaatio-docker).

## Web-hotelli-simulaatio (Docker)

Ennen julkaisua oikealle web-hotellille voit testata sovelluksen
Docker-containerissa, joka jäljittelee tyypillistä shared-hosting-
ympäristöä: **Apache 2.4 + PHP 8** ja staattisten tiedostojen serveri.

**Vaatimukset:** Docker ja Docker Compose v2
([Docker Desktop](https://www.docker.com/products/docker-desktop/), tai
Linuxilla Docker Engine + `docker-compose-plugin`).

```bash
# 1. Varmista että .env on luotu ja kaikki kolme muuttujaa täytetty
#    (DIGITRANSIT_API_KEY, DIGITRANSIT_ENDPOINT, ALLOWED_ORIGIN=http://localhost:8080).
# 2. Käännä + käynnistä container yhdellä komennolla:
docker compose up --build

# Sovellus näkyy: http://localhost:8080
```

Container tekee sisäisesti:

1. Asentaa npm-riippuvuudet ja ajaa `npm run build`.
2. Kopioi `dist/`-kansion sisällön Apachen `/var/www/html`-juureen
   (kuten `public_html` web-hotellissa). Tähän kuuluu myös
   `dist/api/digitransit.php`.
3. Käynnistää Apachen + PHP:n portille 80, joka mapataan hostin porttiin 8080.
4. Välittää ympäristömuuttujat (`DIGITRANSIT_API_KEY`, `ALLOWED_ORIGIN`,
   `DIGITRANSIT_ENDPOINT`) PHP-prosessille `PassEnv`:llä. Kaikki arvot
   luetaan `.env`-tiedostosta — täytä se ennen käynnistystä.

Avain ei näy selaimessa, ei build-imagen kerroksissa, vaan ainoastaan
runtime-ympäristössä. Sammutus: `Ctrl+C` tai `docker compose down`.

## Julkaisu web-hotellille

Sovelluksen kääntäminen tuottaa `dist/`-kansion, jonka sisältö ladataan
hostin `public_html`-juureen (cPanel, FTP/SFTP tai vastaava).

### Kansiorakenne web-hotellissa

**Paras käytäntö:** sijoita `config.php` **`public_html`:n yläpuolelle**
(web-rootin ulkopuolelle), jotta API-avaimesi ei ole koskaan suoraan
saatavilla selaimesta.

```
/home/käyttäjä/
├── config.php              ← API-avain turvassa (web-rootin yläpuolella)
└── public_html/            ← web-root (näkyy webbissä)
    ├── index.html
    ├── assets/
    └── api/
        ├── digitransit.php     ← PHP-proxy
        ├── config.example.php  ← malli (.htaccess estää latauksen)
        └── .htaccess           ← estää config.php:n ja mallin latauksen
```

### Vaiheet

1. **Käännä sovellus paikallisesti:**

   ```bash
   npm run build
   ```

2. **Lataa `dist/`-kansion sisältö** hostin `public_html`-juureen.
   - Varmista, että `api/`-alikansio kopioituu mukana.
   - Varmista, että myös piilotiedosto `api/.htaccess` siirtyy — monet
     FTP-ohjelmat piilottavat pisteellä alkavat tiedostot oletuksena.

3. **Anna asetukset** jommallakummalla tavalla:

   **a) `config.php` (tavallisin web-hotellissa).** Luo tiedosto
   `/home/käyttäjä/config.php` (samaan kansioon, jossa `public_html` näkyy)
   esim. cPanelin File Managerilla tai FTP:llä, ja täytä arvot:

   ```php
   <?php
   return [
       'digitransit_api_key' => 'oma-avaimesi',
       'digitransit_endpoint' => 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/',
       'allowed_origin' => 'https://oma-domain.fi',
   ];
   ```

   Proxy etsii `config.php`:n automaattisesti ensin web-rootin yläpuolelta ja
   sitten omasta kansiostaan — `digitransit.php`:tä ei tarvitse muokata. Jos
   hosting ei salli tiedostoja web-rootin yläpuolella, voit sijoittaa
   tiedoston `public_html/api/config.php`; `api/.htaccess` estää sen
   lataamisen selaimella. Pohjana voi käyttää `api/config.example.php`:tä.

   **b) Ympäristömuuttujat** (jos hosting tukee, esim. cPanelin
   "Environment Variables"):
   - `DIGITRANSIT_API_KEY` = avain
   - `DIGITRANSIT_ENDPOINT` = GraphQL-rajapinnan URL
   - `ALLOWED_ORIGIN` = sivustosi osoite, esim. `https://oma-domain.fi`

   Jos molemmat on annettu, ympäristömuuttuja voittaa `config.php`:n arvon.

   `allowed_origin` kirjoitetaan täsmälleen siinä muodossa kuin selain
   sivuston osoitteen lähettää: protokolla mukaan (`https://`), ilman
   kauttaviivaa loppuun, ja `www.` vain jos sivusto oikeasti avataan sen
   kautta.

4. **Tarkista, että suojaus toimii:**

   ```
   https://oma-domain.fi/                        → sovellus toimii, lähdöt latautuvat
   https://oma-domain.fi/api/digitransit.php     → 405 "Method Not Allowed" (proxy toimii, avain ei näy)
   https://oma-domain.fi/api/config.example.php  → 403 (.htaccess toimii)
   https://oma-domain.fi/api/config.php          → 403 tai 404, ei koskaan tiedoston sisältöä
   ```

### Avaimen vaihto / rotatointi

1. Hanki Digitransit-portaalista uusi avain. Jos tilauksellasi on kaksi
   avainta (primary/secondary), voit ottaa käyttöön toisen niistä.
2. Vaihda uusi avain `config.php`:n `digitransit_api_key`-arvoon (tai
   `DIGITRANSIT_API_KEY`-ympäristömuuttujaan).
3. Kun sovellus toimii uudella avaimella, uusi (regeneroi) vanha avain
   portaalissa, jotta se lakkaa toimimasta.

Sovellusta ei tarvitse kääntää uudelleen.

## Vianetsintä

Virheilmoitus näkyy pysäkkikortissa tai häiriötiedotepaneelissa.

| Virhe | Todennäköinen syy |
| ----- | ----------------- |
| `HTTP 403: Kielletty: väärä origin.` | `ALLOWED_ORIGIN` ei täsmää sivun osoitteeseen. Vertailu on tarkka: `http`/`https`, `www.`, portti ja loppukauttaviiva vaikuttavat. Dockerissa arvon pitää olla `http://localhost:8080`. |
| `HTTP 500: Palvelimelta puuttuu DIGITRANSIT_API_KEY` (tai `…_ENDPOINT`) | Ympäristömuuttujaa ei ole asetettu eikä `config.php`:tä löydy kummastakaan paikasta. Dockerissa: tarkista `.env` ja käynnistä container uudelleen (`docker compose up`). |
| `HTTP 401` | Avain on väärä tai tilaus ei ole voimassa. Tarkista avain Digitransit-portaalista. |
| Devissä `Unexpected token '<'` / `is not valid JSON` | `.env`:stä puuttuu `DIGITRANSIT_ENDPOINT`, jolloin Vite ei luo proxya ja palauttaa `digitransit.php`:n lähdekoodin JSONin sijaan. Käynnistä `npm run dev` uudelleen `.env`:n muokkauksen jälkeen. |
| `HTTP 502: Upstream-virhe` | Palvelin ei saa yhteyttä Digitransitiin: väärä `DIGITRANSIT_ENDPOINT`, hostingin palomuuri tai Digitransitin katko. |

## Tekninen yhteenveto

- **React 18** + **Vite** (ei TypeScriptiä). Ainoa UI-kirjasto on
  **Leaflet** (`react-leaflet`) karttanäkymään.
- **Kartta**: karttalaatat haetaan **OpenStreetMapista** (julkiset, ei
  API-avainta; attribuutio "© OpenStreetMap -tekijät"). Kartalla näkyvät
  pysäkit haetaan `stopsByBbox`-kyselyllä saman PHP-proxyn kautta — Digitransitin
  omia karttalaattoja ei käytetä, jotta API-avain ei vuoda selaimeen.
- Selain kutsuu Digitransit-tietoja varten vain saman domainin
  `/api/digitransit.php`-proxya. PHP lisää `digitransit-subscription-key`-
  headerin ja välittää GraphQL-kutsun `DIGITRANSIT_ENDPOINT`-osoitteeseen.
- Origin-tarkistus: `ALLOWED_ORIGIN` rajaa selainpyynnöt omalta sivustolta
  tuleviin (ks. [Tietosuoja ja tietoturva](#tietosuoja-ja-tietoturva)).
- Asetukset (avain, endpoint, origin) ovat palvelimella joko
  ympäristömuuttujissa tai `config.php`:ssa. Proxy etsii `config.php`:n
  ensin web-rootin yläpuolelta ja sitten `api/`-kansiosta. `api/.htaccess`
  estää `config.php`:n ja sen mallin suoran latauksen.
- Dev-tilassa (`npm run dev` ja `npm run preview`) Vite-server proxyttää
  `/api/digitransit.php`-kutsut suoraan Digitransitiin ja injektoi avaimen
  `.env`-tiedostosta.
- Tila pidetään `useState`/`useLocalStorage`-hookkien kanssa, ei reduxia.
- Lähdöt päivitetään `setInterval`-ajastimella 30 s välein
  (`useDepartures`-hook) ja häiriötiedotteet 60 s välein (`useAlerts`).
  Molemmat pysähtyvät `visibilitychange`-tapahtumaan, kun välilehti on piilossa.
- **Docker**: `Dockerfile` (multi-stage: node-build → php-apache) ja
  `docker-compose.yml` simuloivat web-hotelli-ympäristöä.

## Tekijä

Tämä sovellus on toteutettu **kokonaan Claude-tekoälyllä** (Anthropic) —
koodia ei ole kirjoitettu käsin. Projekti syntyi luonnollisen kielen
komentoja antamalla: vaatimukset, suunnittelu, toteutus ja jatkokehitys
(esim. pysäkin haun bugikorjaus, näkyvyystietoinen polling, PHP-proxyn
lisäys avaimen suojaamiseksi) ohjattiin keskustelemalla Clauden kanssa,
joka kirjoitti, muokkasi ja tarkasti tiedostot. Tämän README-tiedoston
sisältö on niin ikään Clauden tuottamaa.

Kehitysideat ja havainnot: [GitHubin Issues](https://github.com/jmkahko/paikallisLiikenne/issues).

## Lisenssi & lähteet

**Aineiston lähde:** [Digitransit](https://digitransit.fi/) / Tampereen seudun joukkoliikenne

**Aineisto:** © Digitransit 2026, lisenssi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Lue [Digitransit Terms of Use](https://digitransit.fi/en/developers/) saadaksesi lisätietoja API:n käytöstä ja tietojen lisensoinnista.

**Kartta:** karttalaatat © [OpenStreetMap](https://www.openstreetmap.org/copyright)
-tekijät, lisenssi [ODbL](https://opendatacommons.org/licenses/odbl/).
Karttakirjastona [Leaflet](https://leafletjs.com/).
