<?php
declare(strict_types=1);

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

header('Content-Type: application/json; charset=utf-8');

// Salli vain POST.
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['errors' => [['message' => 'Method Not Allowed']]]);
    exit;
}

// 1. Ympäristömuuttuja
$apiKey = (string) (getenv('DIGITRANSIT_API_KEY') ?: '');

// 2. config.php fallback
if ($apiKey === '') {
    $configFile = __DIR__ . '/config.php';
    if (is_file($configFile)) {
        /** @var mixed $config */
        $config = require $configFile;
        if (is_array($config)) {
            $apiKey = (string) ($config['digitransit_api_key'] ?? '');
        }
    }
}

if ($apiKey === '') {
    http_response_code(500);
    echo json_encode([
        'errors' => [[
            'message' => 'Palvelimelta puuttuu DIGITRANSIT_API_KEY '
                . '(aseta env-muuttuja tai luo api/config.php).'
        ]]
    ]);
    exit;
}

// Lue clientin GraphQL-pyynnön runko.
$body = file_get_contents('php://input');
if ($body === false || $body === '') {
    http_response_code(400);
    echo json_encode(['errors' => [['message' => 'Tyhjä pyyntö.']]]);
    exit;
}

// Välitä Digitransitiin.
$endpoint = 'https://api.digitransit.fi/routing/v2/waltti/gtfs/v1/';

if (function_exists('curl_init')) {
    $ch = curl_init($endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'digitransit-subscription-key: ' . $apiKey,
        ],
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $response = curl_exec($ch);
    $status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err      = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        http_response_code(502);
        echo json_encode(['errors' => [['message' => 'Upstream-virhe: ' . $err]]]);
        exit;
    }
} else {
    // Fallback: file_get_contents + HTTP-stream wrapper.
    $context = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/json\r\n"
                              . 'digitransit-subscription-key: ' . $apiKey . "\r\n",
            'content'       => $body,
            'timeout'       => 15,
            'ignore_errors' => true,
        ],
    ]);
    $response = @file_get_contents($endpoint, false, $context);
    $status = 200;
    if (isset($http_response_header[0])
        && preg_match('#HTTP/\S+\s+(\d+)#', $http_response_header[0], $m)
    ) {
        $status = (int) $m[1];
    }
    if ($response === false) {
        http_response_code(502);
        echo json_encode(['errors' => [['message' => 'Upstream-virhe (stream)']]]);
        exit;
    }
}

http_response_code($status ?: 200);
echo $response;
