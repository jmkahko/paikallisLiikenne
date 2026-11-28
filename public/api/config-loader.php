<?php
declare(strict_types=1);           // Pakotetaan tiukat tyypit (int on int, string on string — ei hiljaisia muunnoksia)

/**
 * Yhteinen asetusten lataus PHP-endpointeille (digitransit.php, texts.php).
 *
 * Asetukset luetaan tässä järjestyksessä:
 *   1) Ympäristömuuttujat (esim. Docker-runtimessa)
 *   2) `config.php` (perinteinen web-hotelli — luodaan käsin palvelimelle),
 *      ensin web-rootin yläpuolelta (`public_html/../config.php`, suositeltu)
 *      ja sitten tämän tiedoston kansiosta (`public_html/api/config.php`).
 *
 * Tätä tiedostoa ei kutsuta selaimella — `.htaccess` estää suoran latauksen.
 */

/**
 * Palauttaa asetuksen arvon: ensin env-muuttuja, sitten config.php fallback.
 * Puuttuva asetus palautetaan tyhjänä merkkijonona.
 */
function setting(string $envName, string $configKey): string
{
    static $fileConfig = null;                 // Ladataan config.php vain kerran per pyyntö

    if ($fileConfig === null) {
        $fileConfig = [];                      // Tyhjä taulukko oletuksena
        // Etsitään kahdesta paikasta, ensimmäinen kelvollinen voittaa:
        $configCandidates = [
            dirname(__DIR__, 2) . '/config.php',   // Web-rootin yläpuoli (suositeltu): public_html/api → /home/käyttäjä/
            __DIR__ . '/config.php',               // __DIR__ = tämän tiedoston kansio (eli public_html/api/)
        ];
        foreach ($configCandidates as $configFile) {
            // @ vaimentaa open_basedir-varoituksen, jos hosting ei salli web-rootin yläpuolta
            if (@is_file($configFile)) {       // Tarkistetaan onko tiedosto olemassa
                $loaded = require $configFile; // Ladataan tiedosto — sen pitää palauttaa (return) array
                if (is_array($loaded)) {
                    $fileConfig = $loaded;
                    break;                     // Käytetään ensimmäistä kelvollista (array palauttavaa)
                }
            }
        }
    }

    return (string) (getenv($envName) ?: ($fileConfig[$configKey] ?? ''));
}
