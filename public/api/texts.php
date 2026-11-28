<?php
declare(strict_types=1);           // Pakotetaan tiukat tyypit (int on int, string on string — ei hiljaisia muunnoksia)

/**
 * Käyttöliittymän tekstit MySQL-tietokannasta (issue #29).
 *
 * GET /api/texts.php?lang=fi palauttaa:
 *   {
 *     "lang": "fi", "locale": "fi-FI",
 *     "languages": [{"code": "fi", "name": "Suomi", "locale": "fi-FI"}],
 *     "texts": {"app.subtitle": "Reaaliaikaiset Nysse-lähdöt — valitse jopa {0} pysäkkiä.", …}
 *   }
 * Jos pyydetty kieli ei ole käytössä, palautetaan suomi. Jos valitulta
 * kieleltä puuttuu teksti, tilalle tulee suomenkielinen.
 *
 * Tietokanta-asetukset (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) luetaan kuten
 * digitransit.php:ssä: env-muuttuja tai config.php (ks. config-loader.php).
 * Tekstit ovat julkisia, joten origin-tarkistusta ei tehdä. Taulut luodaan
 * tiedostoilla db/01-schema.sql ja db/02-texts-fi.sql.
 */

// Vastaus on aina JSONia. json_encode muuntaa ääkköset ä-muotoon, joten
// ne säilyvät, vaikka palvelin lähettäisi väärän merkistöheaderin.
header('Content-Type: application/json; charset=utf-8');

const FALLBACK_LANG = 'fi';        // Varakieli: puuttuvat käännökset ja tuntematon kieli

// Lähettää virhevastauksen ja lopettaa. Virhettä ei saa jäädä välimuistiin.
function fail(int $status, string $message): void
{
    http_response_code($status);
    header('Cache-Control: no-store');
    echo json_encode(['error' => $message]);
    exit;
}

// --- VAIHE 1: Tarkista HTTP-metodi -------------------------------------------

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET, HEAD');
    fail(405, 'Method Not Allowed');
}

// --- VAIHE 2: Lue tietokanta-asetukset ---------------------------------------

require __DIR__ . '/config-loader.php';

$dbHost     = setting('DB_HOST', 'db_host');
$dbName     = setting('DB_NAME', 'db_name');
$dbUser     = setting('DB_USER', 'db_user');
$dbPassword = setting('DB_PASSWORD', 'db_password');

if ($dbHost === '' || $dbName === '' || $dbUser === '') {
    fail(500, 'Palvelimelta puuttuu DB_HOST, DB_NAME tai DB_USER '
        . '(aseta env-muuttuja tai lisää config.php:hen).');
}

if (!extension_loaded('pdo_mysql')) {     // Web-hotelleissa yleensä valmiina, Dockerissa asennetaan
    fail(500, 'Palvelimen PHP:stä puuttuu pdo_mysql-laajennus.');
}

// --- VAIHE 3: Yhdistä tietokantaan -------------------------------------------

try {
    // charset=utf8mb4 pakottaa yhteyden UTF-8:ksi — ilman sitä ääkköset voivat
    // rikkoutua, jos palvelimen oletusmerkistö on latin1
    $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4", $dbUser, $dbPassword, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // Virheet poikkeuksina
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,         // Rivit assosiatiivisina taulukkoina
        PDO::ATTR_EMULATE_PREPARES   => false,                    // Oikeat prepared statementit
        PDO::ATTR_TIMEOUT            => 5,                        // Yhteyden avaus max 5 s
    ]);
} catch (PDOException $e) {
    // Tarkka syy vain palvelimen lokiin: viesti voi sisältää palvelimen nimen tai käyttäjätunnuksen
    error_log('texts.php: ' . $e->getMessage());
    fail(503, 'Tietokantaan ei saada yhteyttä.');
}

// --- VAIHE 4: Valitse kieli ja hae tekstit -----------------------------------

try {
    $languages = $pdo->query(
        'SELECT code, name, locale FROM ui_language WHERE enabled = 1 ORDER BY sort_order, code'
    )->fetchAll();

    if ($languages === []) {
        fail(500, 'Tietokannassa ei ole yhtään käytössä olevaa kieltä (ui_language).');
    }

    // Pyydetty kieli, jos se on käytössä — muuten varakieli tai ensimmäinen käytössä oleva
    $requested = is_string($_GET['lang'] ?? null) ? $_GET['lang'] : '';
    $codes     = array_column($languages, 'code');
    $lang      = in_array($requested, $codes, true)
        ? $requested
        : (in_array(FALLBACK_LANG, $codes, true) ? FALLBACK_LANG : $codes[0]);
    $locale    = $languages[array_search($lang, $codes, true)]['locale'];

    // Kaikki avaimet: valitun kielen teksti tai sen puuttuessa varakielen teksti
    $stmt = $pdo->prepare(
        'SELECT k.text_group, k.text_key, COALESCE(t.value, f.value) AS value
           FROM ui_text_key k
           LEFT JOIN ui_text t
             ON t.lang = ? AND t.text_group = k.text_group AND t.text_key = k.text_key
           LEFT JOIN ui_text f
             ON f.lang = ? AND f.text_group = k.text_group AND f.text_key = k.text_key'
    );
    $stmt->execute([$lang, FALLBACK_LANG]);

    $texts = [];
    foreach ($stmt as $row) {
        if ($row['value'] !== null) {       // Avain ilman yhtään tekstiä jätetään pois
            $texts[$row['text_group'] . '.' . $row['text_key']] = $row['value'];
        }
    }
} catch (PDOException $e) {
    error_log('texts.php: ' . $e->getMessage());
    fail(500, 'Tekstien haku tietokannasta epäonnistui (onko db/*.sql-tiedostot ajettu?).');
}

// --- VAIHE 5: Palauta tekstit ------------------------------------------------

$body = json_encode([
    'lang'      => $lang,
    'locale'    => $locale,
    'languages' => $languages,
    'texts'     => (object) $texts,          // (object): tyhjänäkin {} eikä []
]);
if ($body === false) {                       // Esim. tietokannassa virheellistä UTF-8:aa
    fail(500, 'Tekstien muunto JSONiksi epäonnistui (tarkista tietokannan merkistö).');
}

// ETag: selain kysyy joka latauksella, mutta jos tekstit eivät ole muuttuneet,
// vastaus on tyhjä 304. Muokkaus tietokannassa näkyy siis heti seuraavalla latauksella.
// Vertailu sisältää-tyyppisenä, koska Apachen pakkaus voi lisätä ETagiin "-gzip"-päätteen.
$hash = md5($body);
header('ETag: "' . $hash . '"');
header('Cache-Control: no-cache');
if (strpos($_SERVER['HTTP_IF_NONE_MATCH'] ?? '', $hash) !== false) {
    http_response_code(304);                 // 304 = Not Modified
    exit;
}

echo $body;
