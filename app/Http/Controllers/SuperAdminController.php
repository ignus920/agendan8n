<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Services\LeadScoringService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SuperAdminController extends Controller
{
    /**
     * Display a listing of tenants.
     */
    public function index(Request $request)
    {
        // Enforce super_admin role check
        if (!auth()->user()->isSuperAdmin()) {
            abort(403, 'Acceso denegado.');
        }

        $tenants = Tenant::withCount(['contacts', 'bookings'])
            ->orderBy('name')
            ->get();

        $impersonatedTenantId = $request->session()->get('impersonated_tenant_id');
        $impersonatedTenant = $impersonatedTenantId ? Tenant::find($impersonatedTenantId) : null;

        return Inertia::render('Ticsia/Tenants', [
            'tenants' => $tenants,
            'impersonating' => !is_null($impersonatedTenantId),
            'impersonated_tenant' => $impersonatedTenant,
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    public function store(Request $request)
    {
        if (!auth()->user()->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:100|unique:tenants,slug',
            'whatsapp_number' => 'nullable|string|max:20',
            'whatsmark_api_key' => 'nullable|string',
            'whatsmark_instance_id' => 'nullable|string|max:100',
            'n8n_webhook_url' => 'nullable|url',
            'timezone' => 'required|string|max:50',
            'plan_name' => 'required|string|in:free,starter,growth,enterprise',
            'subscription_expires_at' => 'nullable|date',
        ]);

        $tenant = Tenant::create(array_merge($validated, [
            'id' => (string) Str::uuid(),
            'is_active' => true,
            'settings' => [
                'theme' => 'dark',
                'auto_decay_enabled' => true,
            ]
        ]));

        // Generate default lead scoring rules for the new tenant
        LeadScoringService::createDefaultRules($tenant->id);

        return redirect()->back()->with('success', 'Tenant creado exitosamente y reglas de negocio inicializadas.');
    }

    /**
     * Update the specified tenant.
     */
    public function update(Request $request, Tenant $tenant)
    {
        if (!auth()->user()->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:20',
            'whatsmark_api_key' => 'nullable|string',
            'whatsmark_instance_id' => 'nullable|string|max:100',
            'n8n_webhook_url' => 'nullable|url',
            'plan_name' => 'required|string|in:free,starter,growth,enterprise',
            'subscription_status' => 'required|string|in:active,suspended,trial_expired',
            'subscription_expires_at' => 'nullable|date',
            'is_active' => 'required|boolean',
        ]);

        $tenant->update($validated);

        return redirect()->back()->with('success', 'Tenant actualizado exitosamente.');
    }

    /**
     * Impersonate a tenant.
     */
    public function impersonate(Request $request, Tenant $tenant)
    {
        if (!auth()->user()->isSuperAdmin()) {
            abort(403);
        }

        // Set the impersonation target in session
        $request->session()->put('impersonated_tenant_id', $tenant->id);

        return redirect()->route('dashboard')->with('success', "Suplantando a: {$tenant->name}");
    }

    /**
     * Stop impersonating.
     */
    public function stopImpersonating(Request $request)
    {
        if (!auth()->user()->isSuperAdmin()) {
            abort(403);
        }

        $request->session()->forget('impersonated_tenant_id');

        return redirect()->route('ticsia.tenants.index')->with('success', 'Has salido de la suplantación de tenant.');
    }
}
