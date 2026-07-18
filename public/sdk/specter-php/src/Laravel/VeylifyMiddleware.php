<?php

/**
 * Laravel middleware for Veylify token verification.
 * Register in app/Http/Kernel.php and apply to routes that receive
 * a Veylify-protected form submission.
 *
 *   Route::post('/signup', SignupController::class)
 *        ->middleware(\Veylify\Laravel\VeylifyMiddleware::class);
 *
 * Reads the token from the request field "veylify-token" (override via the
 * middleware parameter: ->middleware('veylify:my-field,0.5')).
 */

declare(strict_types=1);

namespace Veylify\Laravel;

use Closure;
use Veylify\Veylify;

class VeylifyMiddleware
{
    /**
     * @param  \Illuminate\Http\Request  $request
     * @param  float|string              $minScore  Minimum acceptable score (0..1).
     */
    public function handle($request, Closure $next, string $field = 'veylify-token', $minScore = 0.0)
    {
        $secret = (string) config(
            'services.veylify.secret',
            getenv('VEYLIFY_SECRET_KEY') ?: getenv('SPECTER_SECRET_KEY')
        );
        $veylify = new Veylify($secret);

        $token  = (string) $request->input($field, '');
        $result = $veylify->siteverify($token);

        $score   = $result['score'] ?? 0.0;
        $scoreOk = $score >= (float) $minScore;

        if (!empty($result['success']) && $scoreOk) {
            // Make the result available downstream: $request->get('veylify').
            $request->attributes->set('veylify', $result);
            $request->attributes->set('specter', $result); // back-compat alias
            return $next($request);
        }

        return response()->json([
            'error' => 'veylify_verification_failed',
            'codes' => $result['error_codes'] ?? [],
        ], 403);
    }
}
