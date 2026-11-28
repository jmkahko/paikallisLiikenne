# Paikallisliikenne — Nysse pysäkit

Yksinkertainen React-sovellus, jolla voit seurata Tampereen Nysse-pysäkkien
seuraavia bussi- ja raitiovaunulähtöjä reaaliaikaisesti. Voit lisätä jopa
**6 pysäkkiä** ja sovellus muistaa valintasi selaimen `localStorage`:ssa.

Tiedot haetaan [Digitransit](https://digitransit.fi/) GraphQL-rajapinnasta
(Waltti / Tampere) **PHP-proxyn kautta**, joka pitää API-avaimen palvelimella.
Käyttöliittymän tekstit haetaan sovelluksen omasta **MySQL-tietokannasta**.

**Sisällys:**
[Ominaisuudet](#ominaisuudet) ·
[Pysäkkien lisääminen](#pysäkkien-lisääminen) ·
[Tietosuoja ja tietoturva](#tietosuoja-ja-tietoturva) ·
[API-avaimen hankinta](#api-avaimen-hankinta) ·
[Asennus ja kehitys](#asennus-ja-kehitys) ·
[Web-hotelli-simulaatio (Docker)](#web-hotelli-simulaatio-docker) ·
[Julkaisu web-hotellille](#julkaisu-web-hotellille) ·
[Tekstit ja kielet](#tekstit-ja-kielet) ·
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
- **Vuoron reitti ja aikataulu** — klikkaamalla aikatauluriviä avautuu
  vuoronäkymä. "Kartta"-välilehdellä näkyy linjan reittiviiva, pysäkit,
  lähtö/määränpää ja ajosuunta, "Aikataulu"-välilehdellä vuoron kaikki pysäkit
  saapumisaikoineen (reaaliaika ja viive, kun saatavilla). Oma pysäkki on
  korostettu. Matkalla olevasta vuorosta näytetään myös **arvioitu sijainti**.
  Näkymä päivittyy 30 sekunnin välein. Huomaa: bussin tai raitiovaunun
  sijainti on **pelkkä arvio aikataulun perusteella** (miltä pysäkiltä vuoro
  on viimeksi lähtenyt ja milloin) — se **ei perustu GPS-paikannukseen**,
  eikä sitä tule käyttää luotettavana tietona bussin tai raitiovaunun
  todellisesta sijainnista.
- **Vuoron jakaminen linkkinä** — vuoronäkymän "Jaa"-painike jakaa linkin
  juuri tähän vuoroon (esim. "olen nyt raitiovaunussa" tai "tulen klo 13 bussilla").
  Aikataulu-välilehdeltä voi valita pysäkin, jolla jää pois: yläreunaan tulee
  arvioitu saapumisaika, ja pysäkki tulee mukaan linkkiin. Puhelimessa
  käytetään järjestelmän jakovalikkoa, tietokoneella viesti ja linkki
  kopioidaan leikepöydälle. Ilman HTTPS-yhteyttä (paitsi `localhost`) linkki
  näytetään tekstikenttänä kopioitavaksi. Linkki avaa vuoronäkymän suoraan,
  myös käyttäjälle, jolla ei ole yhtään pysäkkiä valittuna. Linkki on
  sidottu päivään: myöhemmin avattuna se näyttää, että vuoro on päättynyt.
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
- **Tekstit tietokannassa ja kielet** — kaikki käyttöliittymän tekstit
  haetaan MySQL:stä, joten niitä voi muokata ilman uutta käännöstä ja kieliä
  voi lisätä ilman koodimuutoksia (ks. [Tekstit ja kielet](#tekstit-ja-kielet)).
  Kielinä ovat suomi ja englanti: otsikkorivin kielivalinnasta **FI | EN**
  (valittu kieli lihavoituna) voi vaihtaa kieltä. Oletuskieli on suomi, ja
  oma valinta muistetaan. Myös
  kellonajat ja päivämäärät muotoillaan valitun kielen mukaan, ja
  häiriötiedotteet sekä niiden "Lisätietoja"-linkit haetaan Digitransitista
  valitulla kielellä (jos Nysse ei ole kääntänyt tiedotetta, se näytetään
  suomeksi). Pysäkkien ja linjojen nimet ovat samat kaikilla kielillä. Jos
  tietokanta ei vastaa, sovellus näyttää vikailmoituksen ja
  "Yritä uudelleen" -painikkeen.

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
  määrä, itse valittu kieli (vain jos kieli valitaan) ja tieto
  tietosuojailmoituksen kuittaamisesta (`localStorage`).
  Valintoja ei tallenneta palvelimelle. Evästeitä tai analytiikkaa ei käytetä.
- **Pysäkki- ja aikataulutiedot** haetaan oman palvelimen PHP-proxyn kautta;
  selain ei ota yhteyttä Digitransitiin suoraan, joten Digitransit ei näe
  käyttäjän IP-osoitetta. Web-palvelin tallentaa tavanomaiset palvelinlokit
  (mm. IP-osoite, ajankohta ja pyydetty osoite).
- **Karttakuvat** (laatat) ladataan suoraan OpenStreetMap Foundationin
  palvelimelta, kun käyttäjä avaa kartan (Kartta-välilehti tai vuoron reitti).
  Jokaisesta laattapyynnöstä OpenStreetMap näkee käyttäjän IP-osoitteen,
  ajankohdan, selaimen ja käyttöjärjestelmän (User-Agent), sivuston osoitteen
  (Referer) sekä katsotun kartta-alueen ja zoomaustason. Etusivun avaaminen
  ei vielä ota yhteyttä OpenStreetMapiin, joten erillistä suostumusta ei
  kysytä — asiasta kerrotaan tietosuojailmoituksessa ja Tietoja-ikkunassa.
  Ks. [OpenStreetMap Foundationin tietosuojakäytäntö](https://osmfoundation.org/wiki/Privacy_Policy).
- **Jaettu vuorolinkki** sisältää vain vuoron tunnisteen, päivän sekä
  valitut nousu- ja jääpoispysäkit — ei henkilötietoja. Linkin saaja näkee
  silti, millä vuorolla ja minne olet menossa, joten jaa se vain niille,
  joille haluat sen kertoa.
- **Ylläpitäjä ja yhteydenotot**: kahkonen.dev,
  [GitHubin Issues](https://github.com/jmkahko/paikallisLiikenne/issues).
  Jos julkaiset sovelluksen omalla sivustollasi, päivitä nämä tiedot
  tietokannan tekstiin `about.privacy.contact` (`db/02-texts-fi.sql` ja
  `db/03-texts-en.sql`).
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

Tarvitset [Node.js 20+](https://nodejs.org/) ja
[Dockerin](#web-hotelli-simulaatio-docker): käyttöliittymän tekstit tulevat
MySQL-tietokannasta, jota ajetaan devissäkin Docker-containerissa.

```bash
# 1. Asenna riippuvuudet
npm install

# 2. Luo .env-tiedosto asetuksilla
cp .env.example .env
# avaa .env ja täytä arvot:
#   DIGITRANSIT_API_KEY=oma-avaimesi
#   DIGITRANSIT_ENDPOINT=https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/
#   ALLOWED_ORIGIN=http://localhost:8080
#   DB_NAME=paikallis, DB_USER=paikallis, DB_PASSWORD=keksi-salasana
# (HUOM: muuttujissa EI ole VITE_-prefixiä — arvot eivät mene selainbundleen.)

# 3. Käynnistä tietokanta ja PHP (tekstit) Dockerissa
docker compose up --build -d

# 4. Käynnistä kehityspalvelin
npm run dev
```

Sovellus avautuu osoitteessa <http://localhost:5173>. Vite-dev-palvelin
proxyttää `/api/digitransit.php` -kutsut suoraan Digitransitiin ja lisää
avaimen palvelinpuolella, joten avain pysyy palvelimella myös devissä.
`/api/texts.php` -kutsut se ohjaa Docker-containerin PHP:lle
(<http://localhost:8080>), joka lukee tekstit MySQL:stä. Jos Docker ei ole
käynnissä, sovellus näyttää vikailmoituksen.

Dev-tilassa PHP:tä ei ajeta, joten `ALLOWED_ORIGIN`-tarkistustakaan ei tehdä —
arvoa käytetään vasta Dockerissa ja web-hotellissa. `DIGITRANSIT_ENDPOINT` on
devissä pakollinen: ilman sitä Vite ei luo proxya.

### Tuotantokäännös ja esikatselu

```bash
npm run build      # luo dist/-kansion (sis. dist/api/digitransit.php)
npm run preview    # esikatselu osoitteessa http://localhost:4173
```

`npm run preview` käyttää samaa Vite-proxya kuin `npm run dev`, joten `/api`
toimii (tekstit Dockerin kautta), mutta **`digitransit.php`:tä ei ajeta**. Kun haluat testata PHP-proxyn
(esim. `digitransit.php`:n muutokset tai origin-tarkistuksen), käytä
[Dockeria](#web-hotelli-simulaatio-docker).

## Web-hotelli-simulaatio (Docker)

Ennen julkaisua oikealle web-hotellille voit testata sovelluksen
Docker-containerissa, joka jäljittelee tyypillistä shared-hosting-
ympäristöä: **Apache 2.4 + PHP 8 + MySQL 8 + phpMyAdmin** ja staattisten
tiedostojen serveri.

**Vaatimukset:** Docker ja Docker Compose v2
([Docker Desktop](https://www.docker.com/products/docker-desktop/), tai
Linuxilla Docker Engine + `docker-compose-plugin`).

```bash
# 1. Varmista että .env on luotu ja muuttujat täytetty
#    (DIGITRANSIT_API_KEY, DIGITRANSIT_ENDPOINT, ALLOWED_ORIGIN=http://localhost:8080,
#    DB_NAME, DB_USER, DB_PASSWORD).
# 2. Käännä + käynnistä container yhdellä komennolla:
docker compose up --build

# Sovellus näkyy:  http://localhost:8080
# phpMyAdmin:      http://localhost:8081 (tunnukset .env:n DB_USER / DB_PASSWORD)
```

Container tekee sisäisesti:

1. Asentaa npm-riippuvuudet ja ajaa `npm run build`.
2. Kopioi `dist/`-kansion sisällön Apachen `/var/www/html`-juureen
   (kuten `public_html` web-hotellissa). Tähän kuuluu myös
   `dist/api/digitransit.php`.
3. Asentaa PHP:hen `pdo_mysql`-laajennuksen (web-hotelleissa se on yleensä
   valmiina).
4. Käynnistää Apachen + PHP:n portille 80, joka mapataan hostin porttiin 8080.
5. Välittää ympäristömuuttujat (`DIGITRANSIT_API_KEY`, `ALLOWED_ORIGIN`,
   `DIGITRANSIT_ENDPOINT`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
   PHP-prosessille `PassEnv`:llä. Arvot luetaan `.env`-tiedostosta — täytä se
   ennen käynnistystä. `DB_HOST` on `docker-compose.yml`:ssä kiinteästi `db`.
6. Käynnistää erillisen `db`-containerin (MySQL 8.4), joka luo `.env`:n
   tietokannan ja käyttäjän ja ajaa `db/`-kansion SQL-tiedostot (skeema sekä
   suomen- ja englanninkieliset tekstit). Data säilyy `db-data`-volumessa.
7. Käynnistää **phpMyAdminin** osoitteeseen <http://localhost:8081>, kuten
   web-hotellissa. Sillä voi muokata tekstejä ja harjoitella SQL-tiedostojen
   tuontia ennen julkaisua. Portti on sidottu vain omaan koneeseen
   (`127.0.0.1`).

**Huom:** MySQL ajaa `db/*.sql`-tiedostot vain ensimmäisellä käynnistyksellä,
kun volume on tyhjä. `docker compose up --build` päivittää sovelluksen, mutta
ei kannan tekstejä, joten uudet tekstit näkyvät sovelluksessa avaimina (esim.
`stopCard.remove`), kunnes tiedostot ajetaan kantaan. Kun `db/*.sql` muuttuu,
aja tiedostot olemassa olevaan kantaan joko phpMyAdminin Tuo-välilehdellä (<http://localhost:8081>)
tai komentoriviltä:

```bash
for f in db/0*.sql; do docker compose exec -T db sh -c 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' < "$f"; done
```

Kannan voi myös nollata kokonaan: `docker compose down -v` ja sitten
`docker compose up --build` (tarpeen myös, jos muutat `.env`:n `DB_*`-arvoja).

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
├── config.php              ← API-avain ja tietokantatunnukset turvassa (web-rootin yläpuolella)
└── public_html/            ← web-root (näkyy webbissä)
    ├── index.html
    ├── assets/
    └── api/
        ├── digitransit.php     ← PHP-proxy
        ├── texts.php           ← käyttöliittymän tekstit MySQL:stä
        ├── config-loader.php   ← asetusten luku (.htaccess estää latauksen)
        ├── config.example.php  ← malli (.htaccess estää latauksen)
        └── .htaccess           ← estää config.php:n, apurin ja mallin latauksen
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

3. **Luo tietokanta tekstejä varten** hostingin hallintapaneelissa (esim.
   cPanelin "MySQL Databases"):
   - Luo tietokanta ja käyttäjä. Käyttäjälle riittää **SELECT**-oikeus
     (sovellus vain lukee tekstejä).
   - Valitse phpMyAdminissa vasemmalta luomasi tietokanta ja tuo
     (välilehti "Tuo" / "Import", merkistö `utf-8`) repon tiedostot
     järjestyksessä `db/01-schema.sql`, `db/02-texts-fi.sql` ja
     `db/03-texts-en.sql`. Ne eivät ole
     `dist/`:ssä, koska niitä ei ladata web-palvelimelle.
   - **Jokaisessa julkaisussa** aja `db/02-texts-fi.sql` ja
     `db/03-texts-en.sql` uudelleen samalla tavalla. Se ei haittaa, vaikka
     rivit ovat jo kannassa: puuttuvat tekstit lisätään ja muuttuneet (esim.
     korjatut kirjoitusvirheet) päivitetään tiedoston mukaisiksi. Muita
     tekstejä eikä kielten käyttöönottoa se ei muuta.

4. **Anna asetukset** jommallakummalla tavalla:

   **a) `config.php` (tavallisin web-hotellissa).** Luo tiedosto
   `/home/käyttäjä/config.php` (samaan kansioon, jossa `public_html` näkyy)
   esim. cPanelin File Managerilla tai FTP:llä, ja täytä arvot:

   ```php
   <?php
   return [
       'digitransit_api_key' => 'oma-avaimesi',
       'digitransit_endpoint' => 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/',
       'allowed_origin' => 'https://oma-domain.fi',
       'db_host' => 'localhost',
       'db_name' => 'tietokannan-nimi',
       'db_user' => 'kayttajatunnus',
       'db_password' => 'salasana',
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
   - `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` = tietokannan tiedot

   Jos molemmat on annettu, ympäristömuuttuja voittaa `config.php`:n arvon.

   `allowed_origin` kirjoitetaan täsmälleen siinä muodossa kuin selain
   sivuston osoitteen lähettää: protokolla mukaan (`https://`), ilman
   kauttaviivaa loppuun, ja `www.` vain jos sivusto oikeasti avataan sen
   kautta.

5. **Tarkista, että suojaus toimii:**

   ```
   https://oma-domain.fi/                        → sovellus toimii, lähdöt latautuvat
   https://oma-domain.fi/api/texts.php           → JSON, jossa "lang": "fi" ja "texts" (tietokanta toimii)
   https://oma-domain.fi/api/digitransit.php     → 405 "Method Not Allowed" (proxy toimii, avain ei näy)
   https://oma-domain.fi/api/config.example.php  → 403 (.htaccess toimii)
   https://oma-domain.fi/api/config-loader.php   → 403 (.htaccess toimii)
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

## Tekstit ja kielet

Käyttöliittymän tekstit ovat MySQL-tietokannassa, ja selain hakee ne
`/api/texts.php`:stä ennen sovelluksen näyttämistä. Ylläpitoliittymää ei ole:
suomenkieliset tekstit ylläpidetään tiedostossa `db/02-texts-fi.sql`, joka
ajetaan kantaan phpMyAdminilla (ks. [Julkaisu](#julkaisu-web-hotellille)).
**Tiedosto voittaa:** ajo päivittää kannan tekstit tiedoston mukaisiksi.
Pikakorjauksen voi tehdä suoraan kantaan, mutta tee sama korjaus myös
tiedostoon — muuten seuraava ajo kumoaa sen. Muutos näkyy sovelluksessa
seuraavalla sivulatauksella.

| Taulu | Sisältö |
| ----- | ------- |
| `ui_language` | Kielet: koodi (`fi`), nimi, `locale` (kellonajat ja päivämäärät) ja `enabled`. |
| `ui_text_key` | Jokainen tekstiavain kerran: ryhmä (`text_group`, näkymä kuten `app` tai yhteinen `common`), avain (`text_key`) ja selite (`note`). |
| `ui_text` | Tekstit kielittäin: `lang` + `text_group` + `text_key` → `value`. |

- **Paikanpitimet** `{0}`, `{1}`, … korvataan sovelluksessa luvuilla, teksteillä
  tai linkeillä. Mitä kuhunkin tulee, kerrotaan `ui_text_key.note`-sarakkeessa.
  Linkkien osoitteet ovat koodissa, tietokannassa on vain linkin teksti.
- **Kielet:** suomi (oletus, `db/02-texts-fi.sql`) ja englanti
  (`db/03-texts-en.sql`). Kun käytössä on useampi kieli, otsikkoriville tulee
  kielivalinta (kielikoodit vierekkäin, FI | EN). Käyttäjän oma valinta
  tallennetaan selaimeen (`paikallis.lang.v1`). Kielen saa piilotettua
  asettamalla `ui_language`-taulussa sen `enabled`-arvoksi 0; jos käytössä on
  vain yksi kieli, kielivalintaa ei näytetä.
- **Uusi kieli** lisätään riveinä, ilman koodimuutoksia: rivi `ui_language`-tauluun
  (`enabled = 0` käännöstyön ajaksi) ja käännökset `ui_text`-tauluun, esim.
  omaan tiedostoon `db/04-texts-sv.sql` (mallina `03-texts-en.sql`). Puuttuva
  käännös näytetään suomeksi.

  ```sql
  INSERT INTO ui_language (code, name, locale, sort_order, enabled) VALUES ('sv', 'Svenska', 'sv-SE', 3, 0);
  INSERT INTO ui_text (lang, text_group, text_key, value) VALUES ('sv', 'app', 'tab.map', 'Karta');
  ```

- **Merkistö:** taulut ja yhteys ovat `utf8mb4`. phpMyAdmin (web-hotellissa
  tai Dockerissa <http://localhost:8081>) käyttää sitä automaattisesti. Komentorivin `mysql`-asiakas voi käyttää `latin1`:tä
  (esim. Docker-containerissa), jolloin ääkköset tallentuvat väärin — käytä
  `mysql --default-character-set=utf8mb4` tai aloita `SET NAMES utf8mb4;`.
- **Kehittäjälle:** uusi teksti lisätään tiedostoon `db/02-texts-fi.sql`
  (`ui_text_key` + `ui_text`), käännös tiedostoon `db/03-texts-en.sql` ja
  koodiin `t('ryhmä.avain')`. Kirjoitusvirhe
  korjataan samaan riviin — erillisiä UPDATE-lauseita ei tarvita. Tiedostosta
  poistettu rivi jää kantaan haitattomana; sen voi poistaa `DELETE`-lauseella.
  Dockerin kantaan muutokset saa ajamalla tiedoston uudelleen tai nollaamalla
  kannan (`docker compose down -v`).

## Vianetsintä

Virheilmoitus näkyy pysäkkikortissa tai häiriötiedotepaneelissa. Jos
käyttöliittymän tekstejä ei saada tietokannasta, koko sivulla näkyy
vikailmoitus "Palvelu ei ole juuri nyt käytettävissä" ja sen alla tarkempi syy.

| Virhe | Todennäköinen syy |
| ----- | ----------------- |
| `HTTP 403: Kielletty: väärä origin.` | `ALLOWED_ORIGIN` ei täsmää sivun osoitteeseen. Vertailu on tarkka: `http`/`https`, `www.`, portti ja loppukauttaviiva vaikuttavat. Dockerissa arvon pitää olla `http://localhost:8080`. |
| `HTTP 500: Palvelimelta puuttuu DIGITRANSIT_API_KEY` (tai `…_ENDPOINT`) | Ympäristömuuttujaa ei ole asetettu eikä `config.php`:tä löydy kummastakaan paikasta. Dockerissa: tarkista `.env` ja käynnistä container uudelleen (`docker compose up`). |
| `HTTP 401` | Avain on väärä tai tilaus ei ole voimassa. Tarkista avain Digitransit-portaalista. |
| Devissä `Unexpected token '<'` / `is not valid JSON` | `.env`:stä puuttuu `DIGITRANSIT_ENDPOINT`, jolloin Vite ei luo proxya ja palauttaa `digitransit.php`:n lähdekoodin JSONin sijaan. Käynnistä `npm run dev` uudelleen `.env`:n muokkauksen jälkeen. |
| `HTTP 502: Upstream-virhe` | Palvelin ei saa yhteyttä Digitransitiin: väärä `DIGITRANSIT_ENDPOINT`, hostingin palomuuri tai Digitransitin katko. |
| "Palvelu ei ole juuri nyt käytettävissä" + `HTTP 503: Tietokantaan ei saada yhteyttä.` | `texts.php` ei saa yhteyttä MySQL:ään: väärä `DB_HOST`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` tai tietokanta on alhaalla. Tarkka syy on PHP:n virhelokissa. Dockerissa: onko `db`-container käynnissä (`docker compose ps`)? Jos muutit `.env`:n `DB_*`-arvoja, nollaa kanta (`docker compose down -v`). |
| `HTTP 500: Palvelimelta puuttuu DB_HOST, DB_NAME tai DB_USER` | Tietokanta-asetuksia ei ole ympäristömuuttujissa eikä `config.php`:ssä. |
| `HTTP 500: Palvelimen PHP:stä puuttuu pdo_mysql-laajennus.` | Ota `pdo_mysql` käyttöön hostingin PHP-asetuksista. Dockerissa: `docker compose up --build`. |
| `HTTP 500: Tekstien haku tietokannasta epäonnistui` | Taulut puuttuvat: tuo `db/01-schema.sql`, `db/02-texts-fi.sql` ja `db/03-texts-en.sql`. |
| Devissä "Palvelu ei ole juuri nyt käytettävissä" + `HTTP 404` tai `HTTP 500` | Vite ohjaa `/api/texts.php`:n Dockeriin (`localhost:8080`). Käynnistä `docker compose up --build -d` — myös vanha, ilman `--build`-valitsinta käynnistetty container voi puuttua `texts.php`:n. |
| Sovelluksessa näkyy avaimia, esim. `stopCard.remove` | Tekstiä ei ole tietokannassa. Aja uusimmat `db/02-texts-fi.sql` ja `db/03-texts-en.sql` (phpMyAdmin). Dockerissa `up --build` ei päivitä kantaa — ks. [Docker-osion](#web-hotelli-simulaatio-docker) komento. |
| Ääkköset näkyvät muodossa `Ã¤` | Teksti on tallennettu väärällä merkistöllä (esim. komentorivin `mysql` ilman `--default-character-set=utf8mb4`). Korjaa teksti phpMyAdminilla. |
| Jaettu linkki: `Vuoroa ei löytynyt tälle päivälle.` | Vuoro ei liikennöi linkin päivänä, tai vuorojen tunnisteet ovat vaihtuneet aikataulukauden vaihtuessa. Linkki on tarkoitettu saman päivän käyttöön. |

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
- **Käyttöliittymän tekstit** tulevat MySQL:stä `/api/texts.php`:n kautta
  (PDO, `utf8mb4`, ETag-välimuisti). `TextProvider` (`src/i18n/texts.jsx`)
  hakee ne ennen sovelluksen renderöintiä, ja komponentit käyttävät niitä
  `useText()`-hookilla: `t('app.subtitle', [6])`; kellonaikojen ja päivämäärien
  muotoilu käyttää `useLanguage().locale`-arvoa. Ainoa kovakoodattu teksti on
  vikailmoitus, joka näytetään suomeksi ja englanniksi, jos tietokanta ei
  vastaa. Devissä Vite ohjaa `/api/texts.php`:n Docker-containerille.
- Tila pidetään `useState`/`useLocalStorage`-hookkien kanssa, ei reduxia.
- Lähdöt päivitetään `setInterval`-ajastimella 30 s välein
  (`useDepartures`-hook), avoin vuoronäkymä 30 s välein (`useTrip`) ja
  häiriötiedotteet 60 s välein valitulla kielellä (`useAlerts`). Kaikki pysähtyvät
  `visibilitychange`-tapahtumaan, kun välilehti on piilossa.
- Vuoron pysäkkiajat haetaan tietylle palvelupäivälle
  (`trip.onServiceDate(date:)`), koska sama vuorotunniste ajetaan joka päivä.
  Jaettava linkki on muotoa
  `/?trip=tampere:…&date=YYYY-MM-DD&from=tampere:…&to=tampere:…` ja osoittaa
  `index.html`:ään, joten web-hotelliin ei tarvita uudelleenohjaussääntöjä.
- **Docker**: `Dockerfile` (multi-stage: node-build → php-apache) ja
  `docker-compose.yml` (web + MySQL) simuloivat web-hotelli-ympäristöä.

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
