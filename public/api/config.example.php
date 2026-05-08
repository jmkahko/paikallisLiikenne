<?php
/**
 * Web-hotelli-julkaisua varten:
 *   1) Kopioi tämä tiedosto nimellä `config.php` palvelimelle
 *      samaan kansioon kuin digitransit.php.
 *   2) Korvaa alla oleva paikkamerkki oikealla Digitransit-avaimellasi.
 *
 * `config.php` on `.gitignore`:ssa eikä saa päätyä git-versionhallintaan.
 * `.htaccess` estää sen suoran latauksen selaimella.
 *
 * Vaihtoehtoinen tapa (suositeltu Dockerille tai modernille hostingille):
 * aseta ympäristömuuttuja DIGITRANSIT_API_KEY palvelimelle. Silloin
 * config.php:tä ei tarvita lainkaan.
 */
return [
    'digitransit_api_key' => 'aseta-oikea-avain-tahan',

    // Sallittu origin (CORS). Vain tästä osoitteesta tulevat pyynnöt hyväksytään.
    // Jätä tyhjäksi tai poista rivi jos et halua rajoittaa.
    // Esim. 'https://minunsivuni.fi'
    'allowed_origin' => '',

    // Digitransitin GraphQL-rajapinnan osoite (Waltti/Tampere).
    // Muuta vain jos käytät eri endpointtia.
    'digitransit_endpoint' => 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/',
];
