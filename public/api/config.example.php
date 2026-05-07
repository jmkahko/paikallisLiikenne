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
];
