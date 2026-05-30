<?php

namespace App\Services;

use App\Models\VisualFlow;
use App\Models\Contact;
use Illuminate\Support\Facades\Log;
use App\Services\WhatsMark\WhatsMarkService;

class VisualFlowEngine
{
    public function __construct(
        protected AutomationEngine $automationEngine
    ) {}

    /**
     * Process an incoming event against all active visual flows.
     * Returns true if a visual flow was triggered and executed.
     */
    public function processEvent(string $eventType, array $payload, ?Contact $contact): bool
    {
        if (!$contact || $eventType !== 'message_received') {
            return false;
        }

        $tenantId = $contact->tenant_id;
        $messageText = strtolower(trim($payload['message'] ?? ''));

        if (empty($messageText)) {
            return false;
        }

        // Bridge with AutomationEngine: If user is in booking flow and sends a number, let AutomationEngine process it
        if (is_numeric($messageText) && $contact->getMemory('last_prompt') === 'booking_flow') {
            Log::info("VisualFlowEngine: Skipping numeric message because contact is in booking_flow");
            return false;
        }

        $flows = VisualFlow::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get();

        $executed = false;

        foreach ($flows as $flow) {
            $flowData = $flow->flow_data;
            if (!is_array($flowData) || !isset($flowData['nodes']) || !isset($flowData['edges'])) {
                continue;
            }

            $nodes = $flowData['nodes'];
            $edges = $flowData['edges'];

            // 1. Find all Trigger nodes
            $triggerNodes = array_filter($nodes, function ($node) {
                return ($node['type'] ?? '') === 'trigger' && ($node['data']['isValid'] ?? false) === true;
            });

            // 2. Evaluate Triggers
            $matchedTriggerNode = null;
            $bestMatchScore = 0;

            foreach ($triggerNodes as $node) {
                $outputData = $node['data']['output'][0] ?? null;
                if (!$outputData) continue;

                $replyType = (int) ($outputData['reply_type'] ?? 0);
                $keywords = array_filter(array_map('trim', explode(',', strtolower($outputData['trigger'] ?? ''))));

                $isMatch = false;
                $score = 0;

                // Match logic
                if ($replyType === 1) { // Exact match
                    if (in_array($messageText, $keywords)) {
                        $isMatch = true;
                        $score = 100;
                    }
                } elseif ($replyType === 2) { // Contains
                    foreach ($keywords as $kw) {
                        if ($kw && str_contains($messageText, $kw)) {
                            $isMatch = true;
                            $score = 50;
                            break;
                        }
                    }
                } elseif ($replyType === 3) { // First interaction
                    if ($contact->interactions()->count() <= 1) {
                        $isMatch = true;
                        $score = 10;
                    }
                } elseif ($replyType === 4) { // Fallback
                    $isMatch = true;
                    $score = 1;
                }

                if ($isMatch && $score > $bestMatchScore) {
                    $bestMatchScore = $score;
                    $matchedTriggerNode = $node;
                }
            }

            // 3. If a trigger matched, traverse the graph!
            if ($matchedTriggerNode && $bestMatchScore > 0) {
                Log::info("VisualFlowEngine: Matched trigger node {$matchedTriggerNode['id']} in flow {$flow->name} with score {$bestMatchScore}");
                $this->executeGraph($matchedTriggerNode['id'], $nodes, $edges, $contact);
                $executed = true;
            }
        }

        return $executed;
    }

    /**
     * Traverse and execute the graph starting from the matched trigger node.
     */
    protected function executeGraph(string $startNodeId, array $nodes, array $edges, Contact $contact): void
    {
        $visited = [];
        $currentNodeId = $startNodeId;

        // Find the node by ID
        $getNodeById = function($id) use ($nodes) {
            foreach ($nodes as $node) {
                if (($node['id'] ?? '') === $id) return $node;
            }
            return null;
        };

        // Find edges leaving a node
        $getOutgoingEdges = function($id) use ($edges) {
            return array_filter($edges, function($edge) use ($id) {
                return ($edge['source'] ?? '') === $id;
            });
        };

        $tenant = $contact->tenant;
        $whatsmark = new WhatsMarkService(
            $tenant->whatsmark_api_key,
            $tenant->whatsmark_instance_id
        );

        // Simple BFS/linear traversal
        $queue = [$startNodeId];

        while (!empty($queue)) {
            $nodeId = array_shift($queue);

            if (in_array($nodeId, $visited)) continue;
            $visited[] = $nodeId;

            $node = $getNodeById($nodeId);
            if (!$node) continue;

            // Execute node logic based on type
            $type = $node['type'] ?? '';
            
            if ($type === 'textMessage') {
                $text = $node['data']['output'][0]['reply_text'] ?? '';
                if (!empty($text)) {
                    // Parse placeholders
                    $text = $this->parsePlaceholders($text, $contact);

                    Log::info("VisualFlowEngine: Sending textMessage node {$nodeId} to {$contact->whatsapp_phone}");
                    $whatsmark->sendMessage($contact->whatsapp_phone, $text);
                }
            }
            // For now, only textMessage is fully supported.
            // You can add more types like 'buttonMessage', 'delay', etc. here.

            // Queue next connected nodes
            $outgoing = $getOutgoingEdges($nodeId);
            foreach ($outgoing as $edge) {
                if (isset($edge['target'])) {
                    $queue[] = $edge['target'];
                }
            }
        }
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

        // 4. Replace {schedules_list} placeholder with dynamic DB schedules
        if (str_contains($message, '{schedules_list}')) {
            $schedulesList = $this->generateSchedulesList($contact);
            if ($schedulesList) {
                $message = str_replace('{schedules_list}', trim($schedulesList), $message);
                // Magic: Set the memory so the next numeric message goes to AutomationEngine to process the booking
                $contact->setMemory('last_prompt', 'booking_flow');
            } else {
                $message = str_replace('{schedules_list}', 'No hay horarios disponibles.', $message);
            }
        }

        return $message;
    }

    /**
     * Generate the schedules string based on AutomationEngine's logic.
     */
    protected function generateSchedulesList(Contact $contact): ?string
    {
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

        $listaHorarios = "";
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

        return $hasSlots ? $listaHorarios : null;
    }
}
