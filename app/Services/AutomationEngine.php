<?php

namespace App\Services;

use App\Models\Automation;
use App\Models\AutomationLog;
use App\Models\Contact;
use Illuminate\Support\Facades\Log;

/**
 * AutomationEngine
 *
 * Core engine that processes domain events and executes matching automation rules.
 * This is the heart of the event-driven architecture.
 *
 * Flow: Event → Find matching automations → Evaluate conditions → Execute actions → Log
 */
class AutomationEngine
{
    public function __construct(
        protected N8nService $n8nService,
        protected LeadScoringService $leadScoring,
        protected AiService $aiService,
    ) {}

    /**
     * Process a domain event and execute all matching automations.
     */
    public function processEvent(string $eventType, array $payload, ?Contact $contact = null): void
    {
        $tenantId = $payload['tenant_id'] ?? $contact?->tenant_id;

        if (!$tenantId) {
            Log::warning("AutomationEngine: No tenant_id for event {$eventType}");
            return;
        }

        $automations = Automation::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->forEvent($eventType)
            ->get();

        foreach ($automations as $automation) {
            try {
                // Check cooldown
                if ($this->isInCooldown($automation, $contact)) {
                    $this->logExecution($automation, $contact, $eventType, $payload, [], 'skipped', 'Cooldown active');
                    continue;
                }

                // Evaluate conditions
                if (!$this->evaluateConditions($automation->conditions, $payload, $contact)) {
                    $this->logExecution($automation, $contact, $eventType, $payload, [], 'skipped', 'Conditions not met');
                    continue;
                }

                // Execute actions
                $executedActions = $this->executeActions($automation->actions, $payload, $contact);

                $this->logExecution($automation, $contact, $eventType, $payload, $executedActions, 'success');

            } catch (\Throwable $e) {
                Log::error("AutomationEngine error: {$e->getMessage()}", [
                    'automation_id' => $automation->id,
                    'event_type' => $eventType,
                ]);
                $this->logExecution($automation, $contact, $eventType, $payload, [], 'failed', $e->getMessage());
            }
        }
    }

    /**
     * Check if automation is in cooldown period for this contact.
     */
    protected function isInCooldown(Automation $automation, ?Contact $contact): bool
    {
        if ($automation->cooldown_hours <= 0 || !$contact) {
            return false;
        }

        return AutomationLog::where('automation_id', $automation->id)
            ->where('contact_id', $contact->id)
            ->where('status', 'success')
            ->where('executed_at', '>=', now()->subHours($automation->cooldown_hours))
            ->exists();
    }

    /**
     * Evaluate automation conditions against the event payload and contact.
     */
    protected function evaluateConditions(array $conditions, array $payload, ?Contact $contact): bool
    {
        if (empty($conditions)) {
            return true;
        }

        foreach ($conditions as $field => $expected) {
            $actual = $this->resolveFieldValue($field, $payload, $contact);

            if (is_array($expected)) {
                // Expected is array of allowed values
                if (!in_array($actual, $expected)) {
                    return false;
                }
            } else {
                if (is_string($expected) && str_starts_with($expected, 'regex:')) {
                    $pattern = substr($expected, 6);
                    if (!preg_match($pattern, (string) $actual)) {
                        return false;
                    }
                } else {
                    if ($actual != $expected) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Resolve a dot-notated field value from payload or contact.
     */
    protected function resolveFieldValue(string $field, array $payload, ?Contact $contact): mixed
    {
        // contact.* fields resolve from contact model
        if (str_starts_with($field, 'contact.') && $contact) {
            $attr = str_replace('contact.', '', $field);
            return $contact->getAttribute($attr);
        }

        // booking.*, purchase.* etc resolve from payload
        return data_get($payload, $field);
    }

    /**
     * Execute an array of automation actions.
     */
    protected function executeActions(array $actions, array $payload, ?Contact $contact): array
    {
        $executed = [];

        foreach ($actions as $action) {
            $type = $action['type'] ?? null;
            $params = $action['params'] ?? [];

            if (!$type) continue;

            // Handle delay
            $delayMinutes = $params['delay_minutes'] ?? 0;
            if ($delayMinutes > 0) {
                dispatch(function () use ($type, $params, $payload, $contact) {
                    $this->executeSingleAction($type, $params, $payload, $contact);
                })->delay(now()->addMinutes($delayMinutes));
                $executed[] = ['type' => $type, 'delayed' => $delayMinutes];
                continue;
            }

            $result = $this->executeSingleAction($type, $params, $payload, $contact);
            $executed[] = ['type' => $type, 'result' => $result];
        }

        return $executed;
    }

    /**
     * Execute a single automation action.
     */
    protected function executeSingleAction(string $type, array $params, array $payload, ?Contact $contact): mixed
    {
        return match ($type) {
            'send_whatsapp' => $this->actionSendWhatsApp($params, $contact),
            'update_score' => $this->actionUpdateScore($params, $contact),
            'update_funnel' => $this->actionUpdateFunnel($params, $contact),
            'assign_advisor' => $this->actionAssignAdvisor($params, $contact),
            'trigger_ai' => $this->actionTriggerAi($params, $contact),
            'trigger_n8n' => $this->actionTriggerN8n($params, $payload, $contact),
            'schedule_followup' => $this->actionScheduleFollowup($params, $payload, $contact),
            'update_memory' => $this->actionUpdateMemory($params, $contact),
            'pause_bot' => $this->actionPauseBot($params, $contact),
            'cancel_booking' => $this->actionCancelBooking($params, $contact),
            'reschedule_booking' => $this->actionRescheduleBooking($params, $contact),
            default => Log::warning("Unknown action type: {$type}"),
        };
    }

    protected function actionSendWhatsApp(array $params, ?Contact $contact): ?string
    {
        if (!$contact) return null;

        $tenant = $contact->tenant;
        $whatsmark = new \App\Services\WhatsMark\WhatsMarkService(
            $tenant->whatsmark_api_key,
            $tenant->whatsmark_instance_id
        );

        $template = $params['template'] ?? null;
        $message = $params['message'] ?? null;

        if ($template) {
            return $whatsmark->sendTemplate($contact->whatsapp_phone, $template, $params['template_params'] ?? []);
        }

        if ($message) {
            $message = $this->parsePlaceholders($message, $contact);
            return $whatsmark->sendMessage($contact->whatsapp_phone, $message);
        }

        return null;
    }

    /**
     * Parse dynamic placeholders in WhatsApp message body.
     */
    protected function parsePlaceholders(string $message, Contact $contact): string
    {
        // 1. Replace contact placeholders
        $message = str_replace('{contact.name}', $contact->name ?? 'Cliente', $message);
        $message = str_replace('{contact.phone}', $contact->whatsapp_phone, $message);
        $message = str_replace('{contact.lead_score}', $contact->lead_score, $message);

        // 2. Replace {products_list} placeholder with dynamic DB products
        if (str_contains($message, '{products_list}')) {
            $products = \App\Models\Product::where('tenant_id', $contact->tenant_id)
                ->where('status', 'active')
                ->get();

            $list = "";
            if ($products->isEmpty()) {
                $list = "No tenemos servicios disponibles en este momento.";
            } else {
                foreach ($products as $product) {
                    $formattedPrice = number_format($product->price, 0, ',', '.');
                    $list .= "• *{$product->name}*: \${$formattedPrice} USD\n_{$product->description}_\n\n";
                }
            }
            $message = str_replace('{products_list}', trim($list), $message);
        }

        return $message;
    }

    protected function actionUpdateScore(array $params, ?Contact $contact): void
    {
        if (!$contact) return;

        $delta = $params['delta'] ?? 0;
        $previousScore = $contact->lead_score;
        $newScore = max(0, $contact->lead_score + $delta);

        $level = match (true) {
            $newScore >= 80 => 'hot',
            $newScore >= 60 => 'high',
            $newScore >= 40 => 'medium',
            $newScore >= 20 => 'low',
            default => 'unknown',
        };

        $contact->update([
            'lead_score' => $newScore,
            'interest_level' => $level
        ]);

        event(new \App\Events\ContactScoreChanged($contact, $previousScore, $newScore));
    }

    protected function actionUpdateFunnel(array $params, ?Contact $contact): void
    {
        if (!$contact) return;
        $contact->update(['funnel_stage' => $params['stage'] ?? $contact->funnel_stage]);
    }

    protected function actionAssignAdvisor(array $params, ?Contact $contact): void
    {
        if (!$contact) return;
        $userId = $params['user_id'] ?? null;

        if ($userId === 'round_robin') {
            // Simple round-robin assignment
            $user = \App\Models\User::where('tenant_id', $contact->tenant_id)
                ->where('role', 'advisor')
                ->where('is_active', true)
                ->withCount('assignedContacts')
                ->orderBy('assigned_contacts_count')
                ->first();
            $userId = $user?->id;
        }

        if ($userId) {
            $contact->update(['assigned_user_id' => $userId]);
        }
    }

    protected function actionTriggerAi(array $params, ?Contact $contact): ?array
    {
        if (!$contact) return null;

        $operation = $params['operation'] ?? 'classify';
        $tenant = $contact->tenant;

        $ai = new AiService($tenant->ai_api_token, $tenant->ai_model);

        return match ($operation) {
            'classify' => $ai->classifyIntent($contact, $params['message'] ?? ''),
            'score' => ['score' => $ai->scoreLeadContext($contact)],
            'summarize' => ['summary' => $ai->summarizeConversation($contact)],
            default => null,
        };
    }

    protected function actionTriggerN8n(array $params, array $payload, ?Contact $contact): void
    {
        $webhookUrl = $params['webhook_url'] ?? $contact?->tenant?->n8n_webhook_url;
        if ($webhookUrl) {
            // Extract custom parameters to send to n8n (exclude webhook_url)
            $customParams = collect($params)->except(['webhook_url'])->toArray();

            $this->n8nService->triggerWorkflow($webhookUrl, array_merge($payload, $customParams, [
                'contact_id' => $contact?->id,
                'contact_phone' => $contact?->whatsapp_phone,
            ]));
        }
    }

    protected function actionScheduleFollowup(array $params, array $payload, ?Contact $contact): void
    {
        $delayHours = $params['delay_hours'] ?? 24;
        $followupAction = $params['action'] ?? null;

        if ($followupAction && $contact) {
            dispatch(function () use ($followupAction, $payload, $contact) {
                $this->executeSingleAction(
                    $followupAction['type'],
                    $followupAction['params'] ?? [],
                    $payload,
                    $contact->fresh()
                );
            })->delay(now()->addHours($delayHours));
        }
    }

    protected function actionUpdateMemory(array $params, ?Contact $contact): void
    {
        if (!$contact) return;
        foreach ($params as $key => $value) {
            if ($key !== 'type') {
                $contact->setMemory($key, $value);
            }
        }
    }

    protected function actionPauseBot(array $params, ?Contact $contact): void
    {
        if (!$contact) return;
        $hours = $params['hours'] ?? 1;
        $contact->update([
            'bot_paused' => true,
            'bot_paused_until' => now()->addHours($hours),
        ]);
    }

    protected function actionCancelBooking(array $params, ?Contact $contact): bool
    {
        if (!$contact) return false;

        $booking = \App\Models\Booking::where('tenant_id', $contact->tenant_id)
            ->where('contact_id', $contact->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('created_at', 'desc')
            ->first();

        if ($booking) {
            $booking->cancel();
            $contact->setMemory('active_booking_product_id', null);
            $contact->setMemory('active_booking_resource_id', null);
            return true;
        }

        return false;
    }

    protected function actionRescheduleBooking(array $params, ?Contact $contact): ?array
    {
        if (!$contact) return null;

        $booking = \App\Models\Booking::where('tenant_id', $contact->tenant_id)
            ->where('contact_id', $contact->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('created_at', 'desc')
            ->first();

        if ($booking) {
            $productId = $booking->product_id;
            $resourceId = $booking->resource_id;

            $booking->cancel();

            $contact->setMemory('active_booking_product_id', (string)$productId);
            $contact->setMemory('active_booking_resource_id', (string)$resourceId);

            return [
                'product_id' => $productId,
                'resource_id' => $resourceId
            ];
        }

        return null;
    }

    /**
     * Log automation execution.
     */
    protected function logExecution(
        Automation $automation,
        ?Contact $contact,
        string $eventType,
        array $payload,
        array $actionsExecuted,
        string $status,
        ?string $errorMessage = null
    ): void {
        AutomationLog::create([
            'automation_id' => $automation->id,
            'tenant_id' => $automation->tenant_id,
            'contact_id' => $contact?->id,
            'event_type' => $eventType,
            'event_payload' => $payload,
            'actions_executed' => $actionsExecuted,
            'status' => $status,
            'error_message' => $errorMessage,
            'executed_at' => now(),
        ]);
    }
}
