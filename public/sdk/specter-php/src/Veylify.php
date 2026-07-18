<?php

/**
 * Veylify — Official PHP SDK.
 * ===========================
 * Server-side client for Veylify (AI-bot / ghost-font CAPTCHA protection).
 *
 *   - siteverify(response, secret): confirm a widget verification token
 *     (reCAPTCHA /siteverify equivalent). POST /api/v1/siteverify.
 *   - verifyWebhook(body, header, secret): verify the HMAC-SHA256 signature
 *     of an inbound Veylify webhook (X-Veylify-Signature: t=<ts>,v1=<hmac>).
 *
 * No third-party dependencies — uses cURL (or file_get_contents fallback),
 * hash_hmac and hash_equals. PHP 7.4+.
 *
 * Back-compat: the legacy class `Veylify\Specter` extends this class, so old
 * code doing `new Veylify\Specter(...)` keeps working.
 */

declare(strict_types=1);

namespace Veylify;

class VeylifyException extends \Exception
{
    /** @var string */
    public $errorCode;

    public function __construct(string $message, string $errorCode = 'veylify_error')
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
    }
}

class Veylify
{
    public const DEFAULT_BASE_URL = 'https://api.veylify.com';

    /** @var string */
    private $secret;
    /** @var string */
    private $baseUrl;
    /** @var int seconds */
    private $timeout;

    /**
     * @param string      $secret  Secret key (sk_live_… / sk_test_…).
     * @param string|null $baseUrl API origin. Default https://api.veylify.com
     * @param int         $timeout Request timeout in seconds. Default 8.
     */
    public function __construct(string $secret = '', ?string $baseUrl = null, int $timeout = 8)
    {
        if ($secret !== '') {
            $this->secret = $secret;
        } else {
            $env = (string) getenv('VEYLIFY_SECRET_KEY');
            if ($env === '') {
                $env = (string) getenv('SPECTER_SECRET_KEY'); // back-compat env
            }
            $this->secret = $env;
        }
        $this->baseUrl = rtrim($baseUrl ?? self::DEFAULT_BASE_URL, '/');
        $this->timeout = $timeout;
    }

    /**
     * Confirm a widget verification token. POST /api/v1/siteverify.
     *
     * @param string      $response The verification token returned by the widget.
     * @param string|null $secret   Secret override; falls back to the constructor value.
     *
     * @return array{
     *   success: bool, challenge_ts?: string, hostname?: string,
     *   score?: float, cid?: string, error_codes?: string[]
     * } Decoded API response. `error_codes` is an alias of the API's `error-codes`.
     *
     * @throws VeylifyException on network failure or missing input.
     */
    public function siteverify(string $response, ?string $secret = null): array
    {
        $secret = $secret ?? $this->secret;
        if ($secret === '') {
            throw new VeylifyException('Missing secret key', 'missing-secret');
        }
        if ($response === '') {
            throw new VeylifyException('Missing response token', 'missing-input');
        }

        $payload = json_encode(['secret' => $secret, 'response' => $response]);
        $url     = $this->baseUrl . '/api/v1/siteverify';
        $raw     = $this->postJson($url, $payload);

        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new VeylifyException('Invalid JSON response from Veylify', 'bad-response');
        }
        // Normalize the hyphenated field for PHP-friendly access.
        if (isset($data['error-codes'])) {
            $data['error_codes'] = $data['error-codes'];
        }
        return $data;
    }

    /**
     * Verify the signature of an inbound Veylify webhook.
     *
     * Header format (Stripe-style): `t=<unix-seconds>,v1=<hmac-sha256-hex>`
     * where hmac = hash_hmac('sha256', "{t}.{rawBody}", $secret).
     *
     * IMPORTANT: $body must be the RAW request body (php://input), not a
     * re-encoded array, so the signed bytes match exactly.
     *
     * @param string $body             Raw request body.
     * @param string $header           X-Veylify-Signature header value.
     * @param string $secret           Webhook signing secret.
     * @param int    $toleranceSeconds Max clock skew. Default 300.
     *
     * @return bool true if the signature is valid and fresh.
     */
    public static function verifyWebhook(
        string $body,
        string $header,
        string $secret,
        int $toleranceSeconds = 300
    ): bool {
        if ($header === '' || $secret === '') {
            return false;
        }

        $parts = [];
        foreach (explode(',', $header) as $piece) {
            $pos = strpos($piece, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($piece, 0, $pos));
            $val = trim(substr($piece, $pos + 1));
            $parts[$key] = $val;
        }

        if (empty($parts['t']) || empty($parts['v1'])) {
            return false;
        }
        $ts = (int) $parts['t'];
        $v1 = $parts['v1'];

        // Reject stale / future timestamps (replay protection).
        if (abs(time() - $ts) > $toleranceSeconds) {
            return false;
        }

        $expected = hash_hmac('sha256', $ts . '.' . $body, $secret);

        // Timing-safe comparison.
        return hash_equals($expected, $v1);
    }

    /**
     * Verify + decode an inbound webhook. Throws on invalid signature.
     *
     * @return array{type: string, id: string, created: int, data: array}
     * @throws VeylifyException
     */
    public static function constructEvent(
        string $body,
        string $header,
        string $secret,
        int $toleranceSeconds = 300
    ): array {
        if (!static::verifyWebhook($body, $header, $secret, $toleranceSeconds)) {
            throw new VeylifyException('Invalid webhook signature', 'invalid-signature');
        }
        $event = json_decode($body, true);
        if (!is_array($event)) {
            throw new VeylifyException('Invalid webhook JSON', 'bad-json');
        }
        return $event;
    }

    /**
     * Convenience: verify the token straight from a request array
     * (e.g. $_POST). Returns the full siteverify result.
     *
     * @param array  $requestBody Associative array holding the token.
     * @param string $field       Field name. Default "veylify-token".
     */
    public function verifyRequest(array $requestBody, string $field = 'veylify-token'): array
    {
        $token = isset($requestBody[$field]) ? (string) $requestBody[$field] : '';
        return $this->siteverify($token);
    }

    // -----------------------------------------------------------------
    // Internal HTTP helper (cURL with file_get_contents fallback).
    // -----------------------------------------------------------------
    private function postJson(string $url, string $payload): string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST           => true,
                CURLOPT_POSTFIELDS     => $payload,
                CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT        => $this->timeout,
            ]);
            $out = curl_exec($ch);
            if ($out === false) {
                $err = curl_error($ch);
                curl_close($ch);
                throw new VeylifyException("Network error: {$err}", 'network-error');
            }
            curl_close($ch);
            return (string) $out;
        }

        // Fallback without cURL.
        $context = stream_context_create([
            'http' => [
                'method'        => 'POST',
                'header'        => "Content-Type: application/json\r\n",
                'content'       => $payload,
                'timeout'       => $this->timeout,
                'ignore_errors' => true,
            ],
        ]);
        $out = @file_get_contents($url, false, $context);
        if ($out === false) {
            throw new VeylifyException('Network error', 'network-error');
        }
        return $out;
    }
}
