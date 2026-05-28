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

                if ($eventType === 'message_received') {
                    foreach ($executedActions as $actionResult) {
                        $type = $actionResult['type'] ?? null;
                        if (in_array($type, ['send_whatsapp', 'trigger_n8n', 'send_schedules', 'process_booking'])) {
                            Log::info("AutomationEngine: Stopping further rules propagation because action '{$type}' was executed for automation ID {$automation->id}");
                            break 2; // break the foreach loop and finish processEvent
                        }
                    }
                }

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
    protected function evaluateConditions(?array $conditions, array $payload, ?Contact $contact): bool
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
            'send_schedules' => $this->actionSendSchedules($params, $contact),
            'process_booking' => $this->actionProcessBooking($params, $payload, $contact),
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

        // 2. Replace product and resource dynamic placeholders (non-hardcoded)
        if (str_contains($message, '{last_product.name}') || str_contains($message, '{last_resource.name}')) {
            $productId = $contact->getMemory('active_booking_product_id') ?: $contact->last_product_id;
            $resourceId = $contact->getMemory('active_booking_resource_id');

            if (!$resourceId) {
                // Try to get from last pending/confirmed booking
                $lastBooking = \App\Models\Booking::where('tenant_id', $contact->tenant_id)
                    ->where('contact_id', $contact->id)
                    ->orderBy('created_at', 'desc')
                    ->first();
                if ($lastBooking) {
                    $productId = $productId ?: $lastBooking->product_id;
                    $resourceId = $lastBooking->resource_id;
                }
            }

            if ($productId) {
                $product = \App\Models\Product::find($productId);
                if ($product) {
                    $message = str_replace('{last_product.name}', $product->name, $message);
                }
            }

            if ($resourceId) {
                $resource = \App\Models\Resource::find($resourceId);
                if ($resource) {
                    $message = str_replace('{last_resource.name}', $resource->name, $message);
                }
            }
        }

        // Fallbacks for placeholders if not resolved
        $message = str_replace('{last_product.name}', 'servicio contratado', $message);
        $message = str_replace('{last_resource.name}', 'técnico asignado', $message);

        // 3. Replace {products_list} placeholder with dynamic DB products (numbered 1, 2, 3...)
        if (str_contains($message, '{products_list}')) {
            $products = \App\Models\Product::where('tenant_id', $contact->tenant_id)
                ->where('status', 'active')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            $list = "";
            if ($products->isEmpty()) {
                $list = "No tenemos servicios disponibles en este momento.";
            } else {
                $index = 1;
                foreach ($products as $product) {
                    $formattedPrice = number_format($product->price, 0, ',', '.');
                    $safeDescription = trim(strip_tags($product->description));
                    $safeDescription = \Illuminate\Support\Str::limit($safeDescription, 120);
                    $list .= "• *{$index}. {$product->name}*: \${$formattedPrice} USD\n{$safeDescription}\n\n";
                    $index++;
                    
                    // Prevent exceeding WhatsApp 4096 char limit
                    if (strlen($list) > 3500) {
                        $list .= "\n_(Se omitieron algunos servicios adicionales)_\n";
                        break;
                    }
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

            $mergedPayload = array_merge($payload, $customParams, [
                'contact_id' => $contact?->id,
                'contact_phone' => $contact?->whatsapp_phone,
            ]);

            // Inject product_id and resource_id from memory if not explicitly provided
            if ($contact && !isset($mergedPayload['product_id'])) {
                $productId = $contact->getMemory('active_booking_product_id') ?: $contact->last_product_id;
                if ($productId) {
                    $mergedPayload['product_id'] = $productId;
                }
            }
            if ($contact && !isset($mergedPayload['resource_id'])) {
                $resourceId = $contact->getMemory('active_booking_resource_id');
                if ($resourceId) {
                    $mergedPayload['resource_id'] = $resourceId;
                }
            }

            \Illuminate\Support\Facades\Log::info('actionTriggerN8n: Sending to n8n', [
                'webhook_url' => $webhookUrl,
                'payload_keys' => array_keys($mergedPayload),
                'has_product_id' => isset($mergedPayload['product_id']),
                'has_resource_id' => isset($mergedPayload['resource_id']),
                'product_id_value' => $mergedPayload['product_id'] ?? 'NOT SET',
                'resource_id_value' => $mergedPayload['resource_id'] ?? 'NOT SET',
                'message' => $mergedPayload['message'] ?? 'NO MESSAGE',
            ]);

            $this->n8nService->triggerWorkflow($webhookUrl, $mergedPayload);
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

    protected function actionSendSchedules(array $params, ?Contact $contact): ?array
    {
        if (!$contact) return null;

        $productId = $contact->getMemory('active_booking_product_id') ?: $contact->last_product_id;
        $resourceId = $contact->getMemory('active_booking_resource_id');

        if (!$productId || !$resourceId) {
            $productId = $productId ?: \App\Models\Product::where('tenant_id', $contact->tenant_id)->first()?->id;
            $resourceId = $resourceId ?: \App\Models\Resource::where('tenant_id', $contact->tenant_id)->first()?->id;
            
            if ($productId) $contact->setMemory('active_booking_product_id', (string)$productId);
            if ($resourceId) $contact->setMemory('active_booking_resource_id', (string)$resourceId);
        }

        if (!$productId || !$resourceId) return null;

        $resource = \App\Models\Resource::find($resourceId);
        if (!$resource) return null;

        $controller = app(\App\Http\Controllers\Api\ChatbotApiController::class);
        $tenant = $contact->tenant;

        $timezone = $tenant->timezone ?? 'America/Bogota';
        $checkDate = \Carbon\Carbon::now($timezone);
        $daysChecked = 0;
        $businessDaysFound = 0;
        $optionCounter = 1;

        $listaHorarios = "Por favor selecciona una opción respondiendo con el número:\n\n";
        $hasSlots = false;

        \Carbon\Carbon::setLocale('es');

        while ($businessDaysFound < 3 && $daysChecked < 30) {
            $dateStr = $checkDate->format('Y-m-d');
            $slots = $controller->getSlotsForDate($resource, $dateStr, $productId, $tenant);

            if (!empty($slots)) {
                $businessDaysFound++;
                $friendlyDate = ucfirst($checkDate->translatedFormat('l, d \d\e F'));
                $listaHorarios .= "*" . $friendlyDate . "*\n";

                foreach ($slots as $slot) {
                    $listaHorarios .= "{$optionCounter}. {$slot}\n";
                    $optionCounter++;
                }
                $listaHorarios .= "\n";
                $hasSlots = true;
            }

            $checkDate->addDay();
            $daysChecked++;
        }

        if (!$hasSlots) {
            $listaHorarios = "No hay horarios disponibles en los próximos días.";
        }

        $whatsmark = new \App\Services\WhatsMark\WhatsMarkService(
            $tenant->whatsmark_api_key,
            $tenant->whatsmark_instance_id
        );
        $whatsmark->sendMessage($contact->whatsapp_phone, $listaHorarios);

        return ['slots_found' => $hasSlots];
    }

    protected function actionProcessBooking(array $params, array $payload, ?Contact $contact): ?array
    {
        if (!$contact) return null;

        $selection = trim($payload['message'] ?? '');
        if (!preg_match('/^\d+$/', $selection)) return null;

        $productId = $contact->getMemory('active_booking_product_id') ?: $contact->last_product_id;
        $resourceId = $contact->getMemory('active_booking_resource_id');

        if (!$productId || !$resourceId) {
            $productId = $productId ?: \App\Models\Product::where('tenant_id', $contact->tenant_id)->first()?->id;
            $resourceId = $resourceId ?: \App\Models\Resource::where('tenant_id', $contact->tenant_id)->first()?->id;
        }

        if (!$productId || !$resourceId) {
            $this->actionSendWhatsApp([
                'message' => '❌ Ocurrió un error. No se especificó el servicio o asesor.'
            ], $contact);
            return ['error' => 'missing_requirements'];
        }

        $resource = \App\Models\Resource::find($resourceId);
        if (!$resource) return null;

        $controller = app(\App\Http\Controllers\Api\ChatbotApiController::class);
        $slotsMap = $controller->getResourceSlotsMap($resource, $productId, $contact->tenant);

        $optionIndex = (int) $selection;

        if (!isset($slotsMap[$optionIndex])) {
            $this->actionSendWhatsApp([
                'message' => 'La opción seleccionada no es válida. Por favor responde con un número válido de la lista.'
            ], $contact);
            return ['error' => 'invalid_selection'];
        }

        $startsAtStr = $slotsMap[$optionIndex];

        // Create the booking natively
        $request = new \Illuminate\Http\Request();
        $request->merge([
            'phone' => $contact->whatsapp_phone,
            'name' => $contact->name,
            'product_id' => $productId,
            'resource_id' => $resourceId,
            'starts_at' => $startsAtStr,
            'status' => 'confirmed'
        ]);

        // Mock current_tenant for the controller
        app()->instance('current_tenant', $contact->tenant);
        
        try {
            $response = $controller->book($request);
            $responseData = json_decode($response->getContent(), true);

            if ($response->status() === 200 && ($responseData['status'] ?? '') === 'success') {
                $contact->setMemory('last_prompt', 'main_menu');
                $contact->setMemory('active_booking_product_id', null);
                $contact->setMemory('active_booking_resource_id', null);

                $this->actionSendWhatsApp([
                    'message' => "✅ Tu cita fue agendada correctamente para {$startsAtStr}. Te atenderá: {$resource->name}"
                ], $contact);
                return ['status' => 'success', 'booking_id' => $responseData['data']['booking_id'] ?? null];
            } else {
                $this->actionSendWhatsApp([
                    'message' => '❌ Ocurrió un error creando la reserva: ' . ($responseData['message'] ?? 'Error desconocido.')
                ], $contact);
                return ['error' => 'booking_failed'];
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = collect($e->errors())->flatten()->implode(', ');
            $this->actionSendWhatsApp([
                'message' => '❌ No pudimos agendar la cita. Hubo un error de validación: ' . $errors
            ], $contact);
            return ['error' => 'validation_failed'];
        } catch (\Throwable $e) {
            Log::error("Error in actionProcessBooking: " . $e->getMessage());
            $this->actionSendWhatsApp([
                'message' => '❌ No pudimos agendar la cita por un error inesperado.'
            ], $contact);
            return ['error' => 'system_error'];
        }
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
