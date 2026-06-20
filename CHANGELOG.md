# Muutosloki

Kaikki projektin merkittävät muutokset dokumentoidaan tässä tiedostossa.

Muoto perustuu [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
-käytäntöön ja projekti noudattaa [semanttista versiointia](https://semver.org/).

Käyttäjälle näkyvä versiohistoria löytyy myös sovelluksen Tietoja-ikkunasta
(ℹ️-nappi oikeassa yläkulmassa). Avoimet kehitysideat ja havainnot ovat
[GitHubin Issues-välilehdellä](https://github.com/jmkahko/paikallisLiikenne/issues).

## [Ei julkaistu]

### Lisätty
- Pysäkkien valinta kartalta: pysäkin lisäyksessä on nyt kaksi välilehteä,
  "Haku" ja "Kartta". Karttavälilehdellä (OpenStreetMap-laatat) näkyvälle
  alueelle ladataan pysäkit ja yksittäisen voi lisätä klikkaamalla markkeria.
  Bussi- ja raitiovaunupysäkit erottuvat väreillä. ([#5])

### Korjattu
- Häiriötiedotteiden kohdistus valittuihin pysäkkeihin osui aiemmin vain
  pysäkkikohtaisiin tiedotteisiin. Reittikohtaiset tiedotteet (esim.
  "raitiovaunu 1") ja koko verkkoa koskevat tiedotteet jäivät virheellisesti
  pois "valittuja pysäkkejä koskevat" -näkymästä, vaikka linja pysähtyi
  valitulla pysäkillä. Nyt tiedote tunnistetaan relevantiksi myös reitin
  perusteella, ja tiedotteessa näytetään sitä koskevat linjat. Tiedotteet
  myös järjestetään vakavimmasta lievimpään (saman vakavuuden sisällä tuorein
  ensin), joten Vakava-tiedote ei jää listan loppuun. ([#19])
- CHANGELOG.md:n johdannon linkit Keep a Changelog- ja semanttinen versiointi
  -sivuihin osoittivat olemattomiin suomenkielisiin käännöksiin (404).
  Vaihdettu toimiviin kanonisiin sivuihin. ([#16])

## [1.3.0] - 2026-06-14

### Lisätty
- Muutosloki (`CHANGELOG.md`) ja versiotieto Tietoja-ikkunaan (käytössä oleva
  versio, julkaisupäivä ja linkki täyteen versiohistoriaan).
- Mahdollisuus valita näytettävien lähtöjen määrä (1–5) per pysäkki —
  parantaa käyttökokemusta kapealla puhelimen näytöllä. Valinta tallennetaan
  selaimeen. ([#4])
- Häiriötiedotteet: avattava paneeli näyttää valittuihin pysäkkeihin
  vaikuttavat häiriöt, ja modaalista näkee kaikki Tampereen tiedotteet.
  Päivittyy automaattisesti. ([#8])

### Korjattu
- Pysäkkihaku: lyhyellä hakusanalla ei enää jäänyt tuloksetta. Tampereen
  pysäkit suodatetaan nyt ennen 15 tuloksen rajausta (aiemmin muiden
  Waltti-kaupunkien osumat söivät kiintiön). ([#7])
- Pysäkin haku koodilla toimii nyt (esim. `0001`) — numerohaku tehdään
  suoraan pysäkki-id:llä, koska nimihaku ei täsmää koodiin. ([#7])
- Haku kertoo montako merkkiä pitää vähintään syöttää ja ilmoittaa
  selkeästi, jos haulla ei löydy pysäkkejä. ([#7])

## [1.2.0] - 2026-05-09

### Lisätty
- Tietoja-ikkuna (About-modaali): tietosuoja, reaaliaikainen data, lähdekoodi
  ja lisenssit. Avataan ℹ️-napilla oikeassa yläkulmassa. ([#6])

### Muutettu
- Pysäkkihaku näyttää vain Tampereen pysäkit (rajapinta palauttaa muitakin).
- README:n tuotantokäännös-ohjeet selkeytetty; `npm run preview` ei aja PHP:tä. ([#1])

## [1.1.0] - 2026-05-09

### Muutettu
- Selkeytetty dokumentaatiota sovelluksen viemisestä PHP-tukevaan web-hotelliin.

### Korjattu
- Web-hotellin `config.php`-tiedoston sijainti ja ohjeistus: avain luetaan
  web-rootin yläpuolelta turvallisuuden vuoksi. ([#3])

## [1.0.0] - 2026-05-08

### Lisätty
- Ensimmäinen julkaisu: Tampereen Nysse-pysäkkien reaaliaikainen seuranta.
- Pysäkkihaku ja enintään 6 pysäkin tallennus selaimen `localStorage`:een.
- Reaaliaikaiset bussi- ja raitiovaunulähdöt 30 sekunnin pollingilla;
  polling pysähtyy kun välilehti ei ole näkyvissä (Page Visibility API).
- PHP-proxy Digitransit-rajapintaan — API-avain ei päädy selainbundleen.
- CORS-suojaus (`ALLOWED_ORIGIN`) ja ympäristömuuttuja-pohjainen konfiguraatio.
- Tietosuojailmoitus-banneri ja vaalea/tumma teema järjestelmäasetuksen mukaan.
- Docker-pohjainen web-hotellisimulaatio (`docker compose up`).

[Ei julkaistu]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.3...HEAD
[1.3.0]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.2...v1.3
[1.2.0]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.1...v1.2
[1.1.0]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.0...v1.1
[1.0.0]: https://github.com/jmkahko/paikallisLiikenne/releases/tag/v1.0
[#1]: https://github.com/jmkahko/paikallisLiikenne/issues/1
[#4]: https://github.com/jmkahko/paikallisLiikenne/issues/4
[#5]: https://github.com/jmkahko/paikallisLiikenne/issues/5
[#7]: https://github.com/jmkahko/paikallisLiikenne/issues/7
[#8]: https://github.com/jmkahko/paikallisLiikenne/issues/8
[#3]: https://github.com/jmkahko/paikallisLiikenne/issues/3
[#6]: https://github.com/jmkahko/paikallisLiikenne/issues/6
[#16]: https://github.com/jmkahko/paikallisLiikenne/issues/16
[#19]: https://github.com/jmkahko/paikallisLiikenne/issues/19
