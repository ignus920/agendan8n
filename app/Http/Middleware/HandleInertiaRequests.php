<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $impersonatedTenantId = $request->session()->get('impersonated_tenant_id');

        // Determine the active tenant for this request
        $activeTenant = null;
        if ($user) {
            if ($user->isSuperAdmin() && $impersonatedTenantId) {
                $activeTenant = Tenant::find($impersonatedTenantId);
            } elseif ($user->tenant_id) {
                $activeTenant = $user->tenant;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'impersonated_tenant_id' => $impersonatedTenantId,
                'impersonated_tenant_name' => $activeTenant && $impersonatedTenantId ? $activeTenant->name : null,
            ],
            'currentTenant' => $activeTenant ? [
                'id' => $activeTenant->id,
                'name' => $activeTenant->name,
                'slug' => $activeTenant->slug,
                'plan_name' => $activeTenant->plan_name,
            ] : null,
            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],
        ];
    }
}
