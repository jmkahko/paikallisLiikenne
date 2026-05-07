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

# 2. Luo .env-tiedosto API-avaimen kanssa
cp .env.example .env
# avaa .env ja täytä DIGITRANSIT_API_KEY=oma-avaimesi
# (HUOM: muuttujassa EI ole VITE_-prefixiä — avain ei mene selainbundleen.)

# 3. Käynnistä kehityspalvelin
npm run dev
```

Sovellus avautuu osoitteessa <http://localhost:5173>. Vite-dev-palvelin
proxyttää `/api/digitransit.php` -kutsut suoraan Digitransitiin ja lisää
avaimen palvelinpuolella, joten avain pysyy palvelimella myös devissä.

### Tuotantokäännös

```bash
npm run build      # luo dist/-kansion (sis. dist/api/digitransit.php)
npm run preview    # esikatselu — HUOM: ei aja PHP:tä, /api ei toimi
```

PHP-proxyn testaamiseen käytä Dockeria (alla) tai aja erikseen
`php -S 0.0.0.0:8080 -t dist`.

## 3. Web-hotelli-simulaatio (Docker)

Ennen julkaisua oikealle web-hotellille voit testata sovelluksen
Docker-containerissa, joka jäljittelee tyypillistä shared-hosting-
ympäristöä: **Apache 2.4 + PHP 8** ja staattisten tiedostojen serveri.

**Vaatimukset:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(sis. docker compose).

```bash
# 1. Varmista että .env on luotu ja DIGITRANSIT_API_KEY täytetty.
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
4. Välittää `DIGITRANSIT_API_KEY`-ympäristömuuttujan PHP-prosessille,
   josta proxy lukee sen `getenv()`:llä.

Avain ei näy selaimessa, ei build-imagen kerroksissa, vaan ainoastaan
runtime-ympäristössä. Sammutus: `Ctrl+C` tai `docker compose down`.

## 4. Julkaisu web-hotellille

Sovelluksen kääntäminen tuottaa `dist/`-kansion, jonka sisältö ladataan
hostin `public_html`-juureen (cPanel, FTP/SFTP tai vastaava). Sisällä on
sekä staattiset tiedostot että `dist/api/digitransit.php` + `.htaccess`.

**Vaiheet:**

1. **Käännä sovellus paikallisesti:**

   ```bash
   npm run build
   ```

2. **Lataa `dist/`-kansion sisältö** hostin `public_html`-juureen.
   Varmista että `api/`-alikansio kopioituu mukana.

3. **Aseta API-avain palvelimelle.** Kaksi vaihtoehtoa:

   **A) Ympäristömuuttujana** (jos hosting tukee niitä):
   - cPanelin "Environment Variables" tai vastaavasta paneelista lisää
     `DIGITRANSIT_API_KEY` = avain.

   **B) `config.php`-tiedostona** (toimii kaikilla PHP-hostingeilla):
   - Hostin tiedostonhallinnassa, mene `public_html/api/`-kansioon.
   - Kopioi `config.example.php` → `config.php`.
   - Avaa `config.php` ja korvaa `aseta-oikea-avain-tahan` Digitransit-
     avaimellasi.
   - **`config.php` ei saa päätyä git-repoon** (on `.gitignore`:ssa).

4. **Tarkista että suojaus toimii:**
   `https://oma-domain.fi/api/config.php` → 403 Forbidden.
   `https://oma-domain.fi/api/config.example.php` → 403 Forbidden.

5. **Käytä** sovellusta normaalisti osoitteessa `https://oma-domain.fi/`.

### Avaimen vaihto / rotatointi

Korvaa `public_html/api/config.php`:n `digitransit_api_key`-arvo uudella
avaimella ja generoi vanha tilalle Digitransit-portaalista. Sovellusta ei
tarvitse kääntää uudelleen.

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
  Digitransitiin (`https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/`).
- Avain on palvelimella joko ympäristömuuttujassa (`DIGITRANSIT_API_KEY`)
  tai `api/config.php`:ssa. `.htaccess` estää suoran latauksen.
- Dev-tilassa Vite-server proxyttää `/api/digitransit.php`-kutsut suoraan
  Digitransitiin ja injektoi avaimen `.env`-tiedoston
  `DIGITRANSIT_API_KEY`-muuttujasta.
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

Aineisto: © Tampereen seudun joukkoliikenne / Digitransit, lisenssi
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
