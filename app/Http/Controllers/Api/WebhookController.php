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
        Log::info("WebhookController: Received payload", $request->all());

        try {
            // 1. Resolve Tenant ID
            $tenantId = $request->input('tenant_id') ?? $request->query('tenant_id');

            if (!$tenantId) {
                // Try to resolve via instance_id
                $instanceId = $request->input('instance_id') 
                    ?? $request->input('whatsmark_instance_id') 
                    ?? $request->input('instance.id')
                    ?? $request->input('data.instance_id');

                if ($instanceId) {
                    $tenant = \App\Models\Tenant::where('whatsmark_instance_id', $instanceId)->first();
                    $tenantId = $tenant?->id;
                }
            }

            if (!$tenantId) {
                Log::warning("WebhookController: Unable to resolve tenant_id from payload", $request->all());
                return response()->json([
                    'status' => 'error',
                    'message' => 'tenant_id could not be resolved.'
                ], 400);
            }

            // 2. Extract Phone Number
            $phone = $request->input('phone') 
                ?? $request->input('phone_number') 
                ?? $request->input('sender') 
                ?? $request->input('data.key.remoteJid') 
                ?? $request->input('data.from');

            if ($phone) {
                // Clean phone number: remove @s.whatsapp.net or anything non-numeric
                $phone = preg_replace('/[^0-9]/', '', $phone);
            }

            if (!$phone) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'phone number is required'
                ], 400);
            }

            // Clean number prefix if needed (some systems return country codes)
            $phone = '+' . ltrim($phone, '+');

            // 3. Extract Message & Direction
            $message = $request->input('message') 
                ?? $request->input('message_body')
                ?? $request->input('body') 
                ?? $request->input('data.message.conversation')
                ?? $request->input('data.body');

            $fromMe = $request->input('fromMe') 
                ?? $request->input('data.key.fromMe') 
                ?? false;

            $direction = $request->input('direction') 
                ?? ($fromMe ? 'outbound' : 'inbound');

            $eventType = $request->input('event_type') 
                ?? $request->input('event')
                ?? ($direction === 'inbound' ? 'message_received' : 'message_sent');

            $name = $request->input('name') 
                ?? $request->input('pushName') 
                ?? $request->input('data.pushName') 
                ?? null;

            // Find or create contact
            $contact = Contact::where('tenant_id', $tenantId)
                ->where('whatsapp_phone', $phone)
                ->first();

            if (!$contact) {
                $contact = Contact::create([
                    'tenant_id' => $tenantId,
                    'whatsapp_phone' => $phone,
                    'name' => $name ?? 'Cliente WhatsApp',
                    'funnel_stage' => 'new',
                    'interest_level' => 'unknown',
                    'lead_score' => 0,
                    'tags' => [],
                    'metadata' => [],
                ]);
            } else if (!empty($name) && ($contact->name === 'Cliente WhatsApp' || empty($contact->name))) {
                $contact->update(['name' => $name]);
            }

            // Record interaction if message is present
            if (!empty($message)) {
                $contact->interactions()->create([
                    'tenant_id' => $tenantId,
                    'type' => $request->input('interaction_type') ?? 'message',
                    'direction' => $direction,
                    'content' => $message,
                    'metadata' => $request->input('metadata') ?? [],
                ]);
            }

            // 4. Run Automation Engine
            Log::info("WebhookController: Triggering AutomationEngine for event: {$eventType} and contact: {$contact->id}");
            $automationEngine->processEvent($eventType, [
                'tenant_id' => $tenantId,
                'event_type' => $eventType,
                'phone' => $phone,
                'name' => $name,
                'message' => $message,
                'direction' => $direction,
            ], $contact);

            return response()->json([
                'status' => 'success',
                'contact_id' => $contact->id,
                'lead_score' => $contact->lead_score,
                'funnel_stage' => $contact->funnel_stage,
            ]);

        } catch (\Throwable $e) {
            Log::error("WebhookController handleEvent error: {$e->getMessage()}", [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

