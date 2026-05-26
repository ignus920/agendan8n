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
}
