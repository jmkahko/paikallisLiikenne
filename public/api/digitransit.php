<?php
declare(strict_types=1);           // Pakotetaan tiukat tyypit (int on int, string on string — ei hiljaisia muunnoksia)

/**
 * Digitransit-proxy — pitää API-avaimen palvelimella.
 *
 * Selainpuoli kutsuu tätä endpointtia (/api/digitransit.php) samalla
 * GraphQL-rungolla kuin Digitransit. Tämä skripti lisää
 * `digitransit-subscription-key`-headerin ja välittää pyynnön eteenpäin.
 *
 * Avain luetaan kahdesta paikasta (tässä järjestyksessä):
 *   1) Ympäristömuuttuja DIGITRANSIT_API_KEY (esim. Docker-runtimessa)
 *   2) Sama tiedosto kuin tämä, samassa kansiossa: `config.php`
 *      (perinteinen web-hotelli — luodaan käsin palvelimelle).
 */

// Kerrotaan selaimelle, että vastaus on aina JSON-muotoista (UTF-8-merkistöllä)
header('Content-Type: application/json; charset=utf-8');

// --- VAIHE 1: Tarkista HTTP-metodi -------------------------------------------

// Luetaan pyynnön metodi (GET, POST, PUT jne.) — tyhjä merkkijono jos ei saatavilla
// GraphQL-kyselyt lähetetään aina POSTina, OPTIONS sallitaan CORS-preflight-pyyntöjä varten
$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'POST' && $method !== 'OPTIONS') {
    http_response_code(405);          // 405 = Method Not Allowed
    header('Allow: POST, OPTIONS');   // Kerrotaan selaimelle mitkä metodit ovat sallittuja
    echo json_encode(['errors' => [['message' => 'Method Not Allowed']]]); // Virhevastaus JSON-muodossa
    exit;                             // Lopetetaan skriptin suoritus heti
}

// --- VAIHE 1b: Lataa asetukset (env-muuttujat + config.php fallback) --------

// Ladataan config.php kerran — käytetään fallbackina kaikille asetuksille
$configFile = __DIR__ . '/config.php';     // __DIR__ = tämän tiedoston kansio (eli public/api/)
$fileConfig = [];                          // Tyhjä taulukko oletuksena
if (is_file($configFile)) {               // Tarkistetaan onko tiedosto olemassa
    $loaded = require $configFile;         // Ladataan tiedosto — sen pitää palauttaa (return) array
    if (is_array($loaded)) {
        $fileConfig = $loaded;
    }
}

// Luetaan asetukset: ensin env-muuttuja, sitten config.php fallback
$apiKey        = (string) (getenv('DIGITRANSIT_API_KEY') ?: ($fileConfig['digitransit_api_key'] ?? ''));
$allowedOrigin = (string) (getenv('ALLOWED_ORIGIN')      ?: ($fileConfig['allowed_origin']      ?? ''));
$endpoint      = (string) (getenv('DIGITRANSIT_ENDPOINT') ?: ($fileConfig['digitransit_endpoint'] ?? ''));

// --- VAIHE 1c: CORS — salli pyynnöt vain sallitusta osoitteesta -------------

// Selaimen lähettämä Origin-header (esim. "http://localhost:8080")
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Jos ALLOWED_ORIGIN on määritelty, tarkistetaan että Origin täsmää
if ($allowedOrigin !== '') {
    if ($origin !== $allowedOrigin) {                   // Origin puuttuu tai ei täsmää
        http_response_code(403);                       // 403 = Forbidden (kielletty)
        echo json_encode(['errors' => [['message' => 'Kielletty: väärä origin.']]]);
        exit;
    }
    // Kerrotaan selaimelle että tämä origin on sallittu (CORS-headerit)
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Selain lähettää ensin OPTIONS-preflight-pyynnön ennen varsinaista POSTia
// — vastataan siihen tyhjällä 204:llä ja lopetetaan heti
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);                           // 204 = No Content (ok, ei sisältöä)
    exit;
}

// --- VAIHE 2: Tarkista API-avain --------------------------------------------

// Jos avainta ei löytynyt kummastakaan paikasta → ei voida jatkaa
if ($apiKey === '') {
    http_response_code(500);              // 500 = Internal Server Error (palvelimen ongelma)
    echo json_encode([
        'errors' => [[
            'message' => 'Palvelimelta puuttuu DIGITRANSIT_API_KEY '
                . '(aseta env-muuttuja tai luo api/config.php).'
        ]]
    ]);
    exit;                                 // Lopetetaan — ilman avainta ei voi tehdä mitään
}

// Jos endpointtia ei ole asetettu → ei voida jatkaa
if ($endpoint === '') {
    http_response_code(500);
    echo json_encode([
        'errors' => [[
            'message' => 'Palvelimelta puuttuu DIGITRANSIT_ENDPOINT '
                . '(aseta env-muuttuja tai luo api/config.php).'
        ]]
    ]);
    exit;
}

// --- VAIHE 3: Lue selaimen lähettämä GraphQL-pyyntö --------------------------

// php://input on erikoisosoite, josta saa pyynnön raakarungon (body)
// Tässä se on selaimen lähettämä JSON-muotoinen GraphQL-kysely
$body = file_get_contents('php://input');
if ($body === false || $body === '') {     // Jos body on tyhjä tai lukeminen epäonnistui
    http_response_code(400);              // 400 = Bad Request (selaimen virhe)
    echo json_encode(['errors' => [['message' => 'Tyhjä pyyntö.']]]);
    exit;
}

// --- VAIHE 4: Välitä pyyntö Digitransitin API:lle ----------------------------

// Ensisijainen tapa: käytetään cURL-kirjastoa (nopea, luotettava, lähes aina saatavilla)
if (function_exists('curl_init')) {        // Tarkistetaan onko cURL asennettu palvelimelle
    $ch = curl_init($endpoint);           // Luodaan uusi cURL-yhteys annettuun osoitteeseen
    curl_setopt_array($ch, [              // Asetetaan kaikki asetukset kerralla taulukkona
        CURLOPT_RETURNTRANSFER => true,   // Palauttaa vastauksen merkkijonona (ei tulosta suoraan)
        CURLOPT_POST           => true,   // Käytetään POST-metodia (GraphQL vaatii tämän)
        CURLOPT_POSTFIELDS     => $body,  // Selaimen lähettämä GraphQL-kysely sellaisenaan
        CURLOPT_HTTPHEADER     => [       // HTTP-headerit jotka lähetetään Digitransitille
            'Content-Type: application/json',                    // Kerrotaan että data on JSONia
            'digitransit-subscription-key: ' . $apiKey,          // API-avain joka todentaa meidät
        ],
        CURLOPT_TIMEOUT        => 15,     // Koko pyyntö saa kestää max 15 sekuntia
        CURLOPT_CONNECTTIMEOUT => 8,      // Yhteyden avaus saa kestää max 8 sekuntia
    ]);
    $response = curl_exec($ch);           // Suoritetaan pyyntö — vastaus tulee $response-muuttujaan
    $status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);  // Luetaan HTTP-statuskoodi (200, 400 jne.)
    $err      = curl_error($ch);          // Tallennetaan mahdollinen virheviesti
    curl_close($ch);                      // Suljetaan yhteys ja vapautetaan muisti

    if ($response === false) {            // Jos pyyntö epäonnistui kokonaan (esim. verkko-ongelma)
        http_response_code(502);          // 502 = Bad Gateway (ylävirran palvelin ei vastannut)
        echo json_encode(['errors' => [['message' => 'Upstream-virhe: ' . $err]]]);
        exit;
    }

// Vaihtoehtoinen tapa: käytetään PHP:n sisäänrakennettua file_get_contents-funktiota
// Tämä on hitaampi mutta toimii jos palvelimelle ei ole asennettu cURLia
} else {
    // Luodaan HTTP-pyynnön asetukset "kontekstina" — tämä on PHP:n tapa tehdä pyyntöjä ilman cURLia
    $context = stream_context_create([
        'http' => [                       // HTTP-protokollan asetukset
            'method'        => 'POST',    // POST-metodi kuten cURL-versiossa
            'header'        => "Content-Type: application/json\r\n"        // Samat headerit
                              . 'digitransit-subscription-key: ' . $apiKey . "\r\n",
            'content'       => $body,     // GraphQL-kyselyn sisältö
            'timeout'       => 15,        // Aikakatkaisu sekunneissa
            'ignore_errors' => true,      // Älä kaadu virhestatuksiin — haluamme lukea vastauksen silti
        ],
    ]);
    // @ vaimentaa varoitukset (esim. "failed to open stream") — käsitellään virhe itse alla
    $response = @file_get_contents($endpoint, false, $context);
    $status = 200;                        // Oletusarvo jos statuskoodia ei saada selville
    // PHP:n file_get_contents täyttää automaattisesti $http_response_header-muuttujan
    // Ensimmäinen rivi on muotoa "HTTP/1.1 200 OK" — kaivetaan statuskoodi regexillä
    if (isset($http_response_header[0])
        && preg_match('#HTTP/\S+\s+(\d+)#', $http_response_header[0], $m)  // Etsitään 3-numeroinen koodi
    ) {
        $status = (int) $m[1];            // Tallennetaan löydetty statuskoodi (esim. 200, 400, 500)
    }
    if ($response === false) {            // Jos pyyntö epäonnistui kokonaan
        http_response_code(502);          // 502 = Bad Gateway
        echo json_encode(['errors' => [['message' => 'Upstream-virhe (stream)']]]);
        exit;
    }
}

// --- VAIHE 5: Palautetaan Digitransitin vastaus selaimelle -------------------

http_response_code($status ?: 200);       // Asetetaan sama statuskoodi jonka Digitransit antoi (tai 200)
echo $response;                           // Tulostetaan Digitransitin JSON-vastaus sellaisenaan selaimelle
