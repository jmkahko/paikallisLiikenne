<?php
/**
 * Web-hotelli-julkaisua varten:
 *   1) Kopioi tämä tiedosto nimellä `config.php` palvelimelle
 *      web-rootin yläpuolelle (esim. `/home/käyttäjä/config.php`, eli
 *      `public_html`:n viereen). Tämä on suositeltu paikka: tiedostoa ei
 *      voi ladata selaimella edes palvelimen väärien asetusten vuoksi.
 *      Jos hosting ei salli tätä, sijoita se samaan kansioon kuin
 *      digitransit.php (`public_html/api/config.php`) — silloin `.htaccess`
 *      estää sen suoran latauksen.
 *   2) Korvaa alla olevat arvot omillasi.
 *
 * `config.php` on `.gitignore`:ssa eikä saa päätyä git-versionhallintaan.
 *
 * Vaihtoehtoinen tapa (suositeltu Dockerille tai modernille hostingille):
 * aseta ympäristömuuttujat DIGITRANSIT_API_KEY, DIGITRANSIT_ENDPOINT ja
 * ALLOWED_ORIGIN palvelimelle. Ympäristömuuttuja voittaa config.php:n arvon.
 */
return [
    'digitransit_api_key' => 'aseta-oikea-avain-tahan',

    // Sallittu origin (CORS): sivustosi osoite täsmälleen siinä muodossa kuin
    // selain sen lähettää — protokolla mukaan, ei kauttaviivaa loppuun.
    // Esim. 'https://minunsivuni.fi'
    // Aseta aina tuotannossa. Tyhjä arvo kytkee origin-tarkistuksen pois.
    'allowed_origin' => '',

    // Digitransitin GraphQL-rajapinnan osoite (Waltti/Tampere).
    // Muuta vain jos käytät eri endpointtia.
    'digitransit_endpoint' => 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/',
];
