<?php

namespace App\Http\Controllers;

use App\Models\VisualFlow;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisualFlowController extends Controller
{
    public function index(Request $request)
    {
        $flows = VisualFlow::where('tenant_id', $request->user()->tenant_id)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Settings/VisualFlows/Index', [
            'flows' => $flows
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $flow = VisualFlow::create([
            'tenant_id' => $request->user()->tenant_id,
            'name' => $validated['name'],
            'description' => $validated['description'],
            'flow_data' => [
                'nodes' => [],
                'edges' => [],
            ],
            'is_active' => true,
        ]);

        return redirect()->route('visual-flows.edit', $flow->id)->with('success', 'Flujo visual creado.');
    }

    public function edit(Request $request, $id)
    {
        $tenantId = $request->user()->tenant_id;
        $flow = VisualFlow::where('tenant_id', $tenantId)->findOrFail($id);

        $otherFlows = VisualFlow::where('tenant_id', $tenantId)
            ->where('id', '!=', $id)
            ->where('is_active', true)
            ->get(['id', 'name']);

        $whatsmarkTemplates = [];
        try {
            $tenant = $request->user()->tenant;
            if ($tenant && $tenant->whatsmark_api_key && $tenant->whatsmark_instance_id) {
                $whatsmark = new \App\Services\WhatsMark\WhatsMarkService(
                    $tenant->whatsmark_api_key,
                    $tenant->whatsmark_instance_id
                );
                $whatsmarkTemplates = $whatsmark->getTemplates();
            }
        } catch (\Throwable $th) {
            \Illuminate\Support\Facades\Log::warning("Error fetching WhatsMark templates for flow edit: " . $th->getMessage());
        }

        return Inertia::render('Settings/VisualFlows/Editor', [
            'flow' => $flow,
            'otherFlows' => $otherFlows,
            'whatsmarkTemplates' => $whatsmarkTemplates,
        ]);
    }

    public function update(Request $request, $id)
    {
        $flow = VisualFlow::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'flow_data' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $flow->update($validated);

        return redirect()->back()->with('success', 'Flujo actualizado correctamente.');
    }

    public function destroy(Request $request, $id)
    {
        $flow = VisualFlow::where('tenant_id', $request->user()->tenant_id)
            ->findOrFail($id);

        $flow->delete();

        return redirect()->route('visual-flows.index')->with('success', 'Flujo eliminado.');
    }
}
