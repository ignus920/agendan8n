<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\AutomationEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleEvent(Request $request, AutomationEngine $automationEngine)
    {
        $payload = $request->validate([
            'tenant_id' => 'required|uuid',
            'event_type' => 'required|string',
            'phone' => 'required|string',
            'name' => 'nullable|string',
            'message' => 'nullable|string',
            'direction' => 'nullable|string|in:inbound,outbound',
            'interaction_type' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        try {
            $tenantId = $payload['tenant_id'];
            $phone = $payload['phone'];
            $eventType = $payload['event_type'];

            // Find or create contact
            $contact = Contact::where('tenant_id', $tenantId)
                ->where('whatsapp_phone', $phone)
                ->first();

            if (!$contact) {
                $contact = Contact::create([
                    'tenant_id' => $tenantId,
                    'whatsapp_phone' => $phone,
                    'name' => $payload['name'] ?? null,
                    'funnel_stage' => 'new',
                    'interest_level' => 'unknown',
                    'lead_score' => 0,
                    'tags' => [],
                    'metadata' => [],
                ]);
            } else if (!empty($payload['name']) && empty($contact->name)) {
                $contact->update(['name' => $payload['name']]);
            }

            // Record interaction if message or content is present
            if (!empty($payload['message'])) {
                $contact->interactions()->create([
                    'tenant_id' => $tenantId,
                    'type' => $payload['interaction_type'] ?? 'message',
                    'direction' => $payload['direction'] ?? 'inbound',
                    'content' => $payload['message'],
                    'metadata' => $payload['metadata'] ?? [],
                ]);
            }

            // Run Automation Engine
            $automationEngine->processEvent($eventType, $payload, $contact);

            return response()->json([
                'status' => 'success',
                'contact_id' => $contact->id,
                'lead_score' => $contact->lead_score,
                'funnel_stage' => $contact->funnel_stage,
            ]);

        } catch (\Throwable $e) {
            Log::error("WebhookController handleEvent error: {$e->getMessage()}", [
                'payload' => $request->all()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
