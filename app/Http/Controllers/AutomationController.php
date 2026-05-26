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
}
