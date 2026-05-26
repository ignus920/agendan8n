<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\LeadScoringService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactScoreController extends Controller
{
    public function updateScore(Request $request, LeadScoringService $scoringService)
    {
        $payload = $request->validate([
            'tenant_id' => 'required|uuid',
            'phone' => 'required|string',
            'event_type' => 'required|string',
            'payload' => 'nullable|array',
        ]);

        try {
            $contact = Contact::where('tenant_id', $payload['tenant_id'])
                ->where('whatsapp_phone', $payload['phone'])
                ->firstOrFail();

            $eventPayload = $payload['payload'] ?? [];
            $eventPayload['tenant_id'] = $payload['tenant_id'];

            // Run lead scoring
            $newScore = $scoringService->processEvent($payload['event_type'], $contact, $eventPayload);

            return response()->json([
                'status' => 'success',
                'contact_id' => $contact->id,
                'lead_score' => $newScore,
                'interest_level' => $contact->interest_level,
                'funnel_stage' => $contact->funnel_stage,
            ]);

        } catch (\Throwable $e) {
            Log::error("ContactScoreController error: {$e->getMessage()}", [
                'payload' => $request->all()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
