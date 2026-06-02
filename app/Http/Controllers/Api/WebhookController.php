<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Services\AutomationEngine;
use App\Services\VisualFlowEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleEvent(Request $request, AutomationEngine $automationEngine, VisualFlowEngine $visualFlowEngine)
    {
        Log::info("WebhookController: Received payload", $request->all());

        try {
            // 1. Resolve Tenant ID (prioritize query parameter passed in webhook URL)
            $tenantId = $request->query('tenant_id') ?? $request->input('tenant_id');

            if (!$tenantId) {
                // Fallback: try to resolve via instance_id from query or body
                $instanceId = $request->query('instance_id') 
                    ?? $request->input('instance_id') 
                    ?? $request->input('whatsmark_instance_id');

                if ($instanceId) {
                    $tenant = \App\Models\Tenant::where('whatsmark_instance_id', $instanceId)->first();
                    $tenantId = $tenant?->id;
                }
            }

            // Fallback 2: Check if tenant name or id matches in the payload
            if (!$tenantId && $request->has('tenant.name')) {
                $tenantName = $request->input('tenant.name');
                // Try matching by name or fallback to first active tenant if debug
                $tenant = \App\Models\Tenant::where('name', 'like', "%{$tenantName}%")->first();
                $tenantId = $tenant?->id;
            }

            // Fallback 3: Default to first tenant if still not resolved
            if (!$tenantId) {
                $tenant = \App\Models\Tenant::first();
                if ($tenant) {
                    $tenantId = $tenant->id;
                    Log::info("WebhookController: Defaulting to first tenant ID: {$tenantId}");
                }
            }

            if (!$tenantId) {
                Log::warning("WebhookController: Unable to resolve tenant_id from payload", $request->all());
                return response()->json([
                    'status' => 'error',
                    'message' => 'tenant_id could not be resolved. Please append ?tenant_id=YOUR_UUID to the webhook URL.'
                ], 400);
            }

            // 2. Extract Phone Number (from WhatsMark nested structure)
            $phone = $request->input('data.resource.attributes.from')
                ?? $request->input('relationships.contact.wa_id')
                ?? $request->input('data.relationships.contact.wa_id')
                ?? $request->input('phone') 
                ?? $request->input('phone_number') 
                ?? $request->input('sender');

            if ($phone) {
                $phone = preg_replace('/[^0-9]/', '', $phone);
            }

            if (!$phone) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'phone number is required'
                ], 400);
            }

            $phone = '+' . ltrim($phone, '+');

            // 3. Extract Message & Direction
            $message = $request->input('data.resource.attributes.text')
                ?? $request->input('message') 
                ?? $request->input('message_body')
                ?? $request->input('body');

            $fromMe = $request->input('fromMe') 
                ?? $request->input('data.key.fromMe') 
                ?? false;

            $direction = $request->input('direction') 
                ?? ($fromMe ? 'outbound' : 'inbound');

            // Map WhatsMark events
            $rawEvent = $request->input('event.type') ?? $request->input('event_type') ?? $request->input('event');
            $eventType = 'message_received';
            if ($rawEvent === 'whatsapp.message.received' || $rawEvent === 'message_received') {
                $eventType = 'message_received';
            } else if ($rawEvent === 'whatsapp.message.sent' || $rawEvent === 'message_sent') {
                $eventType = 'message_sent';
            } else if ($rawEvent) {
                $eventType = $rawEvent;
            }

            $name = $request->input('relationships.contact.name')
                ?? $request->input('data.relationships.contact.name')
                ?? $request->input('name') 
                ?? $request->input('pushName') 
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
            } else {
                if (!empty($name) && ($contact->name === 'Cliente WhatsApp' || empty($contact->name))) {
                    $contact->update(['name' => $name]);
                }
            }

            // Record interaction if message is present
            if (!empty($message)) {
                $contact->interactions()->create([
                    'tenant_id' => $tenantId,
                    'type' => $request->input('interaction_type') ?? 'message',
                    'direction' => $direction,
                    'content' => $message,
                    'metadata' => $request->input('metadata') ?? [],
                    'created_at' => now(), // explicitly pass created_at
                ]);
            }

            $payload = [
                'tenant_id' => $tenantId,
                'event_type' => $eventType,
                'phone' => $phone,
                'name' => $name,
                'message' => $message,
                'direction' => $direction,
            ];

            // 4. Run Visual Flow Engine first if the bot is active for this contact
            if ($contact->isBotActive()) {
                Log::info("WebhookController: Triggering VisualFlowEngine for event: {$eventType} and contact: {$contact->id}");
                $visualFlowHandled = $visualFlowEngine->processEvent($eventType, $payload, $contact);

                // 5. Run traditional Automation Engine if visual flow didn't handle it
                if (!$visualFlowHandled) {
                    Log::info("WebhookController: Triggering AutomationEngine for event: {$eventType} and contact: {$contact->id}");
                    $automationEngine->processEvent($eventType, $payload, $contact);
                }
            } else {
                Log::info("WebhookController: Bot is paused for contact {$contact->id}, skipping automation engines.");
            }

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
