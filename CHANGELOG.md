# Muutosloki

Kaikki projektin merkittävät muutokset dokumentoidaan tässä tiedostossa.

Muoto perustuu [Keep a Changelog](https://keepachangelog.com/fi/1.1.0/)
-käytäntöön ja projekti noudattaa [semanttista versiointia](https://semver.org/lang/fi/).

Käyttäjälle näkyvä versiohistoria löytyy myös sovelluksen Tietoja-ikkunasta
(ℹ️-nappi oikeassa yläkulmassa). Avoimet kehitysideat ja havainnot ovat
[GitHubin Issues-välilehdellä](https://github.com/jmkahko/paikallisLiikenne/issues).

## [Ei julkaistu]

### Lisätty
- Muutosloki (`CHANGELOG.md`) ja versiotieto Tietoja-ikkunaan (käytössä oleva
  versio, julkaisupäivä ja linkki täyteen versiohistoriaan).

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

[Ei julkaistu]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.2...HEAD
[1.2.0]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.1...v1.2
[1.1.0]: https://github.com/jmkahko/paikallisLiikenne/compare/v1.0...v1.1
[1.0.0]: https://github.com/jmkahko/paikallisLiikenne/releases/tag/v1.0
[#1]: https://github.com/jmkahko/paikallisLiikenne/issues/1
[#7]: https://github.com/jmkahko/paikallisLiikenne/issues/7
[#3]: https://github.com/jmkahko/paikallisLiikenne/issues/3
[#6]: https://github.com/jmkahko/paikallisLiikenne/issues/6
