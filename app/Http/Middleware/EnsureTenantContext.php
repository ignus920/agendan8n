<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures a valid tenant context exists for every request.
 * For web requests: resolved from authenticated user.
 * For API requests: resolved from X-Tenant-ID header or API key.
 */
class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $this->resolveTenantId($request);

        if (!$tenantId) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Tenant context required'], 403);
            }
            abort(403, 'Tenant context required');
        }

        // Verify tenant exists and is active
        $tenant = Tenant::find($tenantId);
        if (!$tenant || !$tenant->is_active) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Invalid or inactive tenant'], 403);
            }
            abort(403, 'Invalid or inactive tenant');
        }

        // Bind tenant ID to the app container for use by BelongsToTenant trait
        app()->instance('current_tenant_id', $tenantId);
        app()->instance('current_tenant', $tenant);

        // Share tenant with views
        view()->share('currentTenant', $tenant);

        return $next($request);
    }

    protected function resolveTenantId(Request $request): ?string
    {
        // 1. From authenticated user
        if ($user = $request->user()) {
            return $user->tenant_id;
        }

        // 2. From API header
        if ($header = $request->header('X-Tenant-ID')) {
            return $header;
        }

        // 3. From query parameter (webhooks)
        if ($param = $request->query('tenant_id')) {
            return $param;
        }

        return null;
    }
}
