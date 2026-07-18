<?php

/**
 * Veylify\Laravel\SpecterMiddleware — legacy back-compat alias.
 * =============================================================
 * The middleware is now `Veylify\Laravel\VeylifyMiddleware`. This subclass keeps
 * the old class name working so routes still referencing
 * \Veylify\Laravel\SpecterMiddleware::class continue to run unchanged.
 *
 * New code should use \Veylify\Laravel\VeylifyMiddleware.
 */

declare(strict_types=1);

namespace Veylify\Laravel;

require_once __DIR__ . '/VeylifyMiddleware.php';

class SpecterMiddleware extends VeylifyMiddleware
{
}
