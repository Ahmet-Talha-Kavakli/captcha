<?php

/**
 * Veylify\Specter — legacy back-compat alias.
 * ===========================================
 * The SDK class is now `Veylify\Veylify` (see Veylify.php). This file keeps the
 * old class names working so existing code doing `new Veylify\Specter(...)`
 * or catching `Veylify\SpecterException` continues to run unchanged.
 *
 * New code should use `Veylify\Veylify` and `Veylify\VeylifyException`.
 */

declare(strict_types=1);

namespace Veylify;

// Ensure the canonical implementation is loaded even without an autoloader.
require_once __DIR__ . '/Veylify.php';

class SpecterException extends VeylifyException
{
}

class Specter extends Veylify
{
}
