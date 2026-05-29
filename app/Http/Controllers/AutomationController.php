<?php

namespace App\Http\Controllers;

use App\Models\Automation;
use App\Models\LeadScoringRule;
use Inertia\Inertia;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request)
    {
        $automations = Automation::orderByDesc('is_active')
            ->orderBy('priority')
            ->get();

        $scoringRules = LeadScoringRule::orderByDesc('is_active')
            ->orderBy('event_type')
            ->get();

        return Inertia::render('Settings/Automations', [
            'automations' => $automations,
            'scoringRules' => $scoringRules
        ]);
    }

    public function store(Request $request)
    {
        $type = $request->input('rule_type', 'flow');
        
        if ($type === 'scoring') {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'event_type' => 'required|string|max:100',
                'condition' => 'nullable|array',
                'score_delta' => 'required|integer',
                'is_active' => 'required|boolean',
            ]);
            
            $tenantId = $request->user()->tenant_id;
            LeadScoringRule::create(array_merge($validated, ['tenant_id' => $tenantId]));
        } else {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'event_type' => 'required|string|max:100',
                'conditions' => 'nullable|array',
                'actions' => 'required|array',
                'is_active' => 'required|boolean',
                'priority' => 'required|integer',
                'cooldown_hours' => 'required|integer',
            ]);
            
            $tenantId = $request->user()->tenant_id;
            Automation::create(array_merge($validated, ['tenant_id' => $tenantId]));
        }

        return redirect()->back()->with('success', 'Regla creada con éxito.');
    }

    public function update(Request $request, $id)
    {
        $type = $request->input('rule_type', 'flow');
        
        if ($type === 'scoring') {
            $rule = LeadScoringRule::findOrFail($id);
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'event_type' => 'required|string|max:100',
                'condition' => 'nullable|array',
                'score_delta' => 'required|integer',
                'is_active' => 'required|boolean',
            ]);
            $rule->update($validated);
        } else {
            $automation = Automation::findOrFail($id);
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'event_type' => 'required|string|max:100',
                'conditions' => 'nullable|array',
                'actions' => 'required|array',
                'is_active' => 'required|boolean',
                'priority' => 'required|integer',
                'cooldown_hours' => 'required|integer',
            ]);
            $automation->update($validated);
        }

        return redirect()->back()->with('success', 'Regla actualizada con éxito.');
    }

    public function destroy(Request $request, $id)
    {
        $type = $request->input('rule_type', 'flow');
        
        if ($type === 'scoring') {
            $rule = LeadScoringRule::findOrFail($id);
            $rule->delete();
        } else {
            $automation = Automation::findOrFail($id);
            $automation->delete();
        }

        return redirect()->back()->with('success', 'Regla eliminada con éxito.');
    }

    public function simulate(Request $request, \App\Services\AutomationEngine $engine)
    {
        $validated = $request->validate([
            'event_type' => 'required|string|max:100',
            'contact.funnel_stage' => 'nullable|string',
            'contact.lead_score' => 'nullable|integer',
            'contact.is_active' => 'nullable|boolean',
            'payload' => 'nullable|array',
        ]);

        $tenantId = $request->user()->tenant_id;
        
        $contact = new \App\Models\Contact([
            'tenant_id' => $tenantId,
            'name' => 'Contacto Simulado',
            'whatsapp_phone' => '1234567890',
            'funnel_stage' => $validated['contact']['funnel_stage'] ?? 'new',
            'lead_score' => $validated['contact']['lead_score'] ?? 0,
            'is_active' => $validated['contact']['is_active'] ?? true,
        ]);
        
        $contact->id = 999999; // Mock ID

        $payload = array_merge($validated['payload'] ?? [], [
            'tenant_id' => $tenantId,
        ]);

        $engine->enableDryRun();
        $engine->processEvent($validated['event_type'], $payload, $contact);

        return response()->json([
            'logs' => $engine->getDryRunLogs()
        ]);
    }
}
