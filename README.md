# Paikallisliikenne — Nysse pysäkit

Yksinkertainen React-sovellus, jolla voit seurata Tampereen Nysse-pysäkkien
seuraavia bussi- ja raitiovaunulähtöjä reaaliaikaisesti. Voit lisätä jopa
**6 pysäkkiä** ja sovellus muistaa valintasi selaimen `localStorage`:ssa.

Tiedot haetaan [Digitransit](https://digitransit.fi/) GraphQL-rajapinnasta
(Waltti / Tampere) **PHP-proxyn kautta**, joka pitää API-avaimen palvelimella.

## Ominaisuudet

- Pysäkkihaku nimellä tai pysäkkikoodilla.
- Jopa 6 pysäkkiä rinnakkain. Pysäkit tallennetaan selaimeen.
- Seuraavat 5 lähtöä per pysäkki: linja, määränpää, lähtöaika ja "min"-laskuri.
- Reaaliaikamerkki (vihreä piste) kun aikataulutieto on liikenteen GPS:stä.
- Automaattinen päivitys 30 sekunnin välein. Manuaalinen päivitys napilla.
- Polling pysähtyy, kun välilehti ei ole näkyvissä (Page Visibility API),
  ja päivittyy heti kun välilehti palaa eteen — säästää API-kiintiötä.
- Bussit (sininen) ja raitiovaunut (punainen) erottuvat värillä.
- Vaalea/tumma teema seuraa järjestelmäasetusta.
- **API-avain pysyy palvelimella** — selaimessa ei ole avainta missään
  vaiheessa. PHP-proxy välittää GraphQL-kutsut Digitransitiin.
- **CORS-suojaus** — proxy hyväksyy vain omalta sivustolta tulevat pyynnöt
  (`ALLOWED_ORIGIN`). Estää ulkopuolisen väärinkäytön.
- **Tietosuojailmoitus** — kertoo käyttäjälle ensimmäisellä kerralla, että
  sovellus tallentaa pysäkkivalinnat selaimen `localStorage`:en. Ei evästeitä,
  ei analytiikkaa, ei tietojen lähetystä ulkopuolisille. Ilmoituksen voi
  sulkea ja valinta muistetaan.
- **About-sivu** — modale, jossa tiedot sovelluksesta, lisenssistä, Digitransitista
  ja vastuuvapautus. Avataan ℹ️-napilla oikeassa yläkulmassa.

## 1. API-avaimen hankinta

Digitransit vaatii ilmaisen subscription keyn.

1. Mene osoitteeseen <https://portal-api.digitransit.fi/>.
2. Rekisteröidy / kirjaudu sisään.
3. Tilaa **Routing API** -tuote (riittää ilmainen taso).
4. Kopioi avaimesi. Avain näyttää 32 merkin heksamerkkijonolta.

## 2. Asennus ja kehitys

Tarvitset [Node.js 18+](https://nodejs.org/).

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Luo .env-tiedosto asetuksilla
cp .env.example .env
# avaa .env ja täytä kaikki kolme (pakollisia):
#   DIGITRANSIT_API_KEY=oma-avaimesi
#   DIGITRANSIT_ENDPOINT=https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/
#   ALLOWED_ORIGIN=http://localhost:5173
# (HUOM: muuttujissa EI ole VITE_-prefixiä — arvot eivät mene selainbundleen.)

# 3. Käynnistä kehityspalvelin
npm run dev
```

Sovellus avautuu osoitteessa <http://localhost:5173>. Vite-dev-palvelin
proxyttää `/api/digitransit.php` -kutsut suoraan Digitransitiin ja lisää
avaimen palvelinpuolella, joten avain pysyy palvelimella myös devissä.

### Tuotantokäännös

```bash
npm run build      # luo dist/-kansion (sis. dist/api/digitransit.php)
npm run preview    # esikatselu
```

## 3. Web-hotelli-simulaatio (Docker)

Ennen julkaisua oikealle web-hotellille voit testata sovelluksen
Docker-containerissa, joka jäljittelee tyypillistä shared-hosting-
ympäristöä: **Apache 2.4 + PHP 8** ja staattisten tiedostojen serveri.

**Vaatimukset:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(sis. docker compose).

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

## 4. Julkaisu web-hotellille

Sovelluksen kääntäminen tuottaa `dist/`-kansion, jonka sisältö ladataan
hostin `public_html`-juureen (cPanel, FTP/SFTP tai vastaava).

### Kansiorakenne web-hotellissa

**Paras käytäntö:** sijoita `config.php` **`public_html`:n yläpuolelle**
(web-rootin ulkopuolelle), jotta API-avaimesi ei ole koskaan suoraan
saatavilla selaimesta.

```
/home/käyttäjä/
├── config.php              ← API-avain turvassa! (yläpuolella)
├── public_html/            ← web-root (näkyy webbissä)
│   ├── index.html
│   ├── api/
│   │   └── digitransit.php ← PHP-proxy
│   ├── [muut staattiset tiedostot]
│   └── .htaccess           ← estää .env:n suoran latauksen
```

### Vaiheet:

1. **Käännä sovellus paikallisesti:**

   ```bash
   npm run build
   ```

2. **Lataa `dist/`-kansion sisältö** hostin `public_html`-juureen.
   - Varmista että `api/`-alikansio kopioituu mukana (sisältää `digitransit.php`-tiedoston)

3. **Luo `config.php` web-hotellin juureen** (`public_html`:n yläpuolelle):

   - Avaa hostin tiedostonhallinta (cPanel File Manager, FTP/SFTP, jne.)
   - Siirry `/home/käyttäjä/`-tasoon (sama kansio missä `public_html` näkyy)
   - Luo uusi tiedosto `config.php`
   - Kopioi seuraava sisältö ja täytä arvot:

   ```php
   <?php
   // config.php - web-hotellin juuressa (public_html:n yläpuolella)
   
   return [
       'digitransit_api_key' => 'your-api-key-here',
       'digitransit_endpoint' => 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/',
       'allowed_origin' => 'https://oma-domain.fi',
   ];
   ```

4. **Päivitä `digitransit.php`:ssä config-tiedoston polku:**

   Jos `digitransit.php` on `public_html/api/`-kansiossa, muuta polku:

   ```php
   $configFile = realpath(__DIR__ . '/../../config.php');
   if (!$configFile || !file_exists($configFile)) {
       http_response_code(500);
       die('Config file not found');
   }
   ```

   - `__DIR__` = `public_html/api` (tämän tiedoston kansio)
   - `/../../config.php` = mennään kaksi tasoa ylös ja etsitään `config.php`

5. **Suojaa tiedostot:**

   Lisää `public_html/`-juureen `.htaccess`-tiedosto:

   ```apache
   <Files ".env">
       Order allow,deny
       Deny from all
   </Files>
   <FilesMatch "\.example\.php$">
       Order allow,deny
       Deny from all
   </FilesMatch>
   ```

6. **Aseta ympäristömuuttujat** (jos hosting tukee niitä):

   cPanelin "Environment Variables" tai vastaavasta paneelista lisää:
   - `DIGITRANSIT_API_KEY` = avain
   - `DIGITRANSIT_ENDPOINT` = GraphQL-rajapinnan URL
   - `ALLOWED_ORIGIN` = sivustosi osoite, esim. `https://oma-domain.fi`

   (Jos et käytä ympäristömuuttujia, käytä `config.php`:tä edellä kuvatulla tavalla.)

7. **Tarkista että suojaus toimii:**

   ```
   https://oma-domain.fi/config.php → 404 (ei näy: on yläpuolella!)
   https://oma-domain.fi/digitransit.php → 500 tai muuttaa sisällön (ei näy avaimena)
   https://oma-domain.fi/ → sovellus toimii normaalisti ✓
   ```

8. **Käytä** sovellusta normaalisti osoitteessa `https://oma-domain.fi/`.

### Avaimen vaihto / rotatointi

Korvaa web-hotellin juuressa olevan `config.php`:n `digitransit_api_key`-arvo
(tai `DIGITRANSIT_API_KEY`-ympäristömuuttuja) uudella avaimella ja generoi
vanha tilalle Digitransit-portaalista. Sovellusta ei tarvitse kääntää
uudelleen.

## Pysäkkien lisääminen

1. Hae pysäkki nimellä (esim. `Keskustori`, `Hervanta`) tai pysäkkikoodilla
   (esim. `0501`).
2. Klikkaa hakutulosta — pysäkki ilmestyy alas omaan korttiin.
3. Korttien painikkeilla voit järjestää (↑/↓), päivittää (↻) tai poistaa (✕).
4. Kun olet lisännyt 6 pysäkkiä, hakukenttä lukkiutuu kunnes poistat jonkin.

Pysäkkivalintasi tallennetaan automaattisesti selaimeen — ne säilyvät
sivulatausten yli.

## Tekninen yhteenveto

- **React 18** + **Vite** (ei TypeScriptiä, ei lisäkirjastoja UI:lle).
- Selain kutsuu vain saman domainin `/api/digitransit.php`-proxya. PHP
  lisää `digitransit-subscription-key`-headerin ja välittää GraphQL-kutsun
  `DIGITRANSIT_ENDPOINT`-osoitteeseen.
- CORS-suojaus: `ALLOWED_ORIGIN`-muuttuja rajaa pyynnöt vain omalta
  sivustolta tuleviin.
- Asetukset (avain, endpoint, origin) ovat palvelimella joko
  ympäristömuuttujissa tai `config.php`:ssa, joka sijoitetaan web-rootin
  yläpuolelle (`public_html`-kansion yläpuolelle) turvallisuuden vuoksi.
  `.htaccess` estää muiden sensitiivisten tiedostojen suoran latauksen.
- Dev-tilassa Vite-server proxyttää `/api/digitransit.php`-kutsut suoraan
  Digitransitiin ja injektoi avaimen `.env`-tiedostosta.
- Tila pidetään `useState`/`useLocalStorage`-hookkien kanssa, ei reduxia.
- Päivitys ajastimella `setInterval` (30 s) komponentin sisällä,
  pysäytetty `visibilitychange`-tapahtumaan kun välilehti on piilossa.
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

## Lisenssi & lähteet

**Aineiston lähde:** [Digitransit](https://digitransit.fi/) / Tampereen seudun joukkoliikenne

**Aineisto:** © Digitransit 2026, lisenssi [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Lue [Digitransit Terms of Use](https://digitransit.fi/en/developers/) saadaksesi lisätietoja API:n käytöstä ja tietojen lisensoinnista.
