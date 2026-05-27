<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Resource;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ChatbotApiController extends Controller
{
    /**
     * List active products/services for the current tenant.
     */
    public function products(Request $request)
    {
        $products = Product::active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'price', 'duration_minutes', 'repurchase_frequency_days', 'images']);

        return response()->json([
            'status' => 'success',
            'data' => $products
        ]);
    }

    /**
     * List active resources/advisors for the current tenant.
     */
    public function resources(Request $request)
    {
        $resources = Resource::active()
            ->orderBy('name')
            ->get(['id', 'name', 'type', 'description', 'capacity']);

        return response()->json([
            'status' => 'success',
            'data' => $resources
        ]);
    }

    /**
     * Get available time slots for a resource on a specific date.
     */
    public function availability(Request $request, Resource $resource)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'product_id' => 'nullable|exists:products,id',
        ]);

        $tenant = app('current_tenant');
        $slots = $this->getSlotsForDate(
            $resource,
            $request->input('date'),
            $request->input('product_id'),
            $tenant
        );

        return response()->json([
            'status' => 'success',
            'date' => $request->input('date'),
            'slots' => $slots
        ]);
    }

    /**
     * Helper to get slots for a specific date.
     */
    protected function getSlotsForDate(Resource $resource, string $dateString, ?int $productId, $tenant): array
    {
        $date = Carbon::parse($dateString);
        
        $duration = 30; // default to 30 mins
        if ($productId) {
            $product = Product::find($productId);
            if ($product && $product->duration_minutes) {
                $duration = $product->duration_minutes;
            }
        }

        $timezone = $tenant->timezone ?? 'America/Bogota';

        // 1. Check exceptions
        $exception = $resource->exceptions()
            ->where('exception_date', $dateString)
            ->first();

        $startTimeStr = null;
        $endTimeStr = null;

        if ($exception) {
            if (!$exception->is_available) {
                return [];
            }
            $startTimeStr = $exception->start_time;
            $endTimeStr = $exception->end_time;
        } else {
            // 2. Check weekly schedule
            $dayOfWeek = $date->dayOfWeek;
            $schedule = $resource->schedules()
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->first();

            if (!$schedule) {
                return [];
            }
            $startTimeStr = $schedule->start_time;
            $endTimeStr = $schedule->end_time;
        }

        $startWorking = Carbon::parse("{$dateString} {$startTimeStr}", $timezone);
        $endWorking = Carbon::parse("{$dateString} {$endTimeStr}", $timezone);

        $slots = [];
        $currentSlotStart = clone $startWorking;
        
        while ($currentSlotStart->copy()->addMinutes($duration)->lte($endWorking)) {
            $currentSlotEnd = $currentSlotStart->copy()->addMinutes($duration);

            if ($currentSlotStart->isPast()) {
                $currentSlotStart->addMinutes(30);
                continue;
            }

            if ($resource->isAvailableAt($currentSlotStart, $currentSlotEnd)) {
                $slots[] = $currentSlotStart->format('H:i');
            }

            $currentSlotStart->addMinutes(30);
        }

        return $slots;
    }

    /**
     * Generate the mapping of option number (1, 2, 3...) to datetime for the next 3 available days.
     */
    protected function getResourceSlotsMap(Resource $resource, ?int $productId, $tenant): array
    {
        $slotsMap = [];
        $optionCounter = 1;
        $timezone = $tenant->timezone ?? 'America/Bogota';
        
        $checkDate = Carbon::now($timezone);
        $daysChecked = 0;
        $businessDaysFound = 0;

        while ($businessDaysFound < 3 && $daysChecked < 30) {
            $dateStr = $checkDate->format('Y-m-d');
            $slots = $this->getSlotsForDate($resource, $dateStr, $productId, $tenant);

            if (!empty($slots)) {
                $businessDaysFound++;
                foreach ($slots as $slot) {
                    $slotsMap[$optionCounter] = "{$dateStr} {$slot}:00";
                    $optionCounter++;
                }
            }

            $checkDate->addDay();
            $daysChecked++;
        }

        return $slotsMap;
    }

    /**
     * Book a slot for a client.
     */
    public function book(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'name' => 'nullable|string|max:255',
            'product_id' => 'required|exists:products,id',
            'resource_id' => 'required|exists:resources,id',
            'starts_at' => 'required|string',
            'notes' => 'nullable|string',
            'status' => 'nullable|string|in:pending,confirmed',
        ]);

        $tenant = app('current_tenant');
        $tenantId = $tenant->id;
        
        $product = Product::find($validated['product_id']);
        $resource = Resource::find($validated['resource_id']);
        
        $startsAtStr = $validated['starts_at'];

        // Clean selection and resolve if it is numeric (e.g. 1, 2, 28)
        $cleanSelection = trim($startsAtStr);
        if (preg_match('/^\d+$/', $cleanSelection)) {
            $optionIndex = (int) $cleanSelection;
            $slotsMap = $this->getResourceSlotsMap($resource, $product->id, $tenant);
            if (isset($slotsMap[$optionIndex])) {
                $startsAtStr = $slotsMap[$optionIndex];
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => "La opción seleccionada ($optionIndex) no es válida o ya no está disponible."
                ], 422);
            }
        } else {
            // Also attempt to extract the first digit if the user replied "1. 10:00"
            $extractedDigit = preg_replace('/[^\d].*$/', '', $cleanSelection);
            if (is_numeric($extractedDigit) && (int)$extractedDigit > 0) {
                $optionIndex = (int) $extractedDigit;
                $slotsMap = $this->getResourceSlotsMap($resource, $product->id, $tenant);
                if (isset($slotsMap[$optionIndex])) {
                    $startsAtStr = $slotsMap[$optionIndex];
                }
            }
        }

        try {
            $startsAt = Carbon::createFromFormat('Y-m-d H:i:s', $startsAtStr, $tenant->timezone);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'El formato de fecha/hora o selección no es válido.'
            ], 422);
        }

        $duration = $product->duration_minutes ?? 30;
        $endsAt = $startsAt->copy()->addMinutes($duration);

        if ($startsAt->isPast()) {
            return response()->json([
                'status' => 'error',
                'message' => 'No se puede agendar una cita en una fecha/hora pasada.'
            ], 422);
        }

        if (!$resource->isAvailableAt($startsAt, $endsAt)) {
            return response()->json([
                'status' => 'error',
                'message' => 'El asesor/recurso no está disponible en este horario.'
            ], 422);
        }

        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $phoneWithPlus = '+' . $cleanPhone;

        $contact = Contact::where('tenant_id', $tenantId)
            ->where(function ($q) use ($cleanPhone, $phoneWithPlus) {
                $q->where('whatsapp_phone', $cleanPhone)
                  ->orWhere('whatsapp_phone', $phoneWithPlus);
            })
            ->first();

        if (!$contact) {
            $contact = Contact::create([
                'tenant_id' => $tenantId,
                'whatsapp_phone' => $cleanPhone,
                'name' => $validated['name'] ?? 'Cliente de WhatsApp',
                'funnel_stage' => 'interested',
                'interest_level' => 'high',
                'lead_score' => 20,
                'tags' => ['whatsapp-bot'],
                'metadata' => ['created_by_bot' => true]
            ]);
        }

        $repurchaseDays = $product->repurchase_frequency_days;
        $nextRepurchase = $repurchaseDays ? Carbon::now()->addDays($repurchaseDays) : null;

        $contact->update([
            'last_product_id' => $product->id,
            'next_repurchase_at' => $nextRepurchase,
            'funnel_stage' => 'qualified'
        ]);

        $status = $validated['status'] ?? 'pending';
        $booking = Booking::create([
            'tenant_id' => $tenantId,
            'contact_id' => $contact->id,
            'resource_id' => $resource->id,
            'product_id' => $product->id,
            'title' => "Cita: {$product->name} - {$contact->name}",
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'status' => $status,
            'source' => 'whatsapp',
            'notes' => $validated['notes'] ?? null,
            'metadata' => [
                'created_by_bot' => true
            ]
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Cita agendada exitosamente.',
            'data' => [
                'booking_id' => $booking->id,
                'starts_at' => $booking->starts_at->toDateTimeString(),
                'ends_at' => $booking->ends_at->toDateTimeString(),
                'status' => $booking->status,
                'resource_name' => $resource->name,
                'contact' => [
                    'id' => $contact->id,
                    'name' => $contact->name,
                    'phone' => $contact->whatsapp_phone
                ]
            ]
        ]);
    }

    /**
     * Send a WhatsApp message dynamically using current tenant's WhatsMark credentials.
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => 'required|string',
            'message_body' => 'required|string',
        ]);

        $tenant = app('current_tenant');

        if (!$tenant->whatsmark_api_key || !$tenant->whatsmark_instance_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'El tenant no tiene configuradas las credenciales de WhatsMark.'
            ], 422);
        }

        // Forward request to WhatsMark API
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $tenant->whatsmark_api_key,
        ])->post("https://chat.dosil.com.co/api/v1/{$tenant->whatsmark_instance_id}/messages/send", [
            'phone_number' => $validated['phone_number'],
            'message_body' => $validated['message_body'],
        ]);

        if ($response->successful()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Mensaje enviado exitosamente a través de WhatsMark.',
                'data' => $response->json()
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Error al enviar mensaje mediante WhatsMark.',
            'details' => $response->body()
        ], $response->status());
    }

    /**
     * Save chatbot session state for a contact.
     */
    public function saveSession(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'product_id' => 'required|integer',
            'resource_id' => 'required|integer',
        ]);

        $tenant = app('current_tenant');
        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $phoneWithPlus = '+' . $cleanPhone;

        $contact = Contact::where('tenant_id', $tenant->id)
            ->where(function ($q) use ($cleanPhone, $phoneWithPlus) {
                $q->where('whatsapp_phone', $cleanPhone)
                  ->orWhere('whatsapp_phone', $phoneWithPlus);
            })
            ->first();

        if (!$contact) {
            $contact = Contact::create([
                'tenant_id' => $tenant->id,
                'whatsapp_phone' => $cleanPhone,
                'name' => 'Cliente de WhatsApp',
                'funnel_stage' => 'new',
            ]);
        }

        $contact->setMemory('active_booking_product_id', $validated['product_id']);
        $contact->setMemory('active_booking_resource_id', $validated['resource_id']);

        return response()->json([
            'status' => 'success',
            'message' => 'Sesión de reserva guardada exitosamente.'
        ]);
    }

    /**
     * Resolve chatbot session state globally by phone.
     */
    public function resolveSession(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'tenant_id' => 'nullable|string',
        ]);

        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $phoneWithPlus = '+' . $cleanPhone;
        $tenantId = $request->header('X-Tenant-ID') ?: $request->input('tenant_id');

        $query = Contact::withoutGlobalScope('tenant')
            ->where(function ($q) use ($cleanPhone, $phoneWithPlus) {
                $q->where('whatsapp_phone', $cleanPhone)
                  ->orWhere('whatsapp_phone', $phoneWithPlus);
            });

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $contact = $query->first();

        if (!$contact) {
            return response()->json([
                'status' => 'error',
                'message' => 'Contacto no encontrado.'
            ], 404);
        }

        $productId = $contact->getMemory('active_booking_product_id');
        $resourceId = $contact->getMemory('active_booking_resource_id');

        return response()->json([
            'status' => 'success',
            'data' => [
                'tenant_id' => $contact->tenant_id,
                'product_id' => $productId ? (int) $productId : null,
                'resource_id' => $resourceId ? (int) $resourceId : null,
            ]
        ]);
    }

    /**
     * Cancel the contact's last pending/confirmed booking.
     */
    public function cancelBooking(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
        ]);

        $tenant = app('current_tenant');
        $tenantId = $tenant->id;

        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $phoneWithPlus = '+' . $cleanPhone;

        $contact = Contact::where('tenant_id', $tenantId)
            ->where(function ($q) use ($cleanPhone, $phoneWithPlus) {
                $q->where('whatsapp_phone', $cleanPhone)
                  ->orWhere('whatsapp_phone', $phoneWithPlus);
            })
            ->first();

        if (!$contact) {
            return response()->json([
                'status' => 'error',
                'message' => 'Contacto no encontrado.'
            ], 404);
        }

        $booking = Booking::where('tenant_id', $tenantId)
            ->where('contact_id', $contact->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$booking) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes citas activas para cancelar.'
            ], 404);
        }

        $booking->cancel();

        // Reset contact stage to lost and decrease score
        $newScore = max(0, $contact->lead_score - 15);
        $level = match (true) {
            $newScore >= 80 => 'hot',
            $newScore >= 60 => 'high',
            $newScore >= 40 => 'medium',
            $newScore >= 20 => 'low',
            default => 'unknown',
        };

        $contact->update([
            'funnel_stage' => 'lost',
            'lead_score' => $newScore,
            'interest_level' => $level
        ]);

        $contact->setMemory('active_booking_product_id', null);
        $contact->setMemory('active_booking_resource_id', null);

        return response()->json([
            'status' => 'success',
            'message' => 'Tu cita ha sido cancelada exitosamente.',
            'booking' => $booking
        ]);
    }

    /**
     * Cancel the contact's last pending/confirmed booking, but save service in memory for rescheduling.
     */
    public function rescheduleBooking(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string',
        ]);

        $tenant = app('current_tenant');
        $tenantId = $tenant->id;

        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $phoneWithPlus = '+' . $cleanPhone;

        $contact = Contact::where('tenant_id', $tenantId)
            ->where(function ($q) use ($cleanPhone, $phoneWithPlus) {
                $q->where('whatsapp_phone', $cleanPhone)
                  ->orWhere('whatsapp_phone', $phoneWithPlus);
            })
            ->first();

        if (!$contact) {
            return response()->json([
                'status' => 'error',
                'message' => 'Contacto no encontrado.'
            ], 404);
        }

        $booking = Booking::where('tenant_id', $tenantId)
            ->where('contact_id', $contact->id)
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$booking) {
            return response()->json([
                'status' => 'error',
                'message' => 'No tienes citas activas para reprogramar.'
            ], 404);
        }

        $productId = $booking->product_id;
        $resourceId = $booking->resource_id;

        $booking->cancel();

        // Save back in session memory so n8n can fetch it
        $contact->setMemory('active_booking_product_id', (string)$productId);
        $contact->setMemory('active_booking_resource_id', (string)$resourceId);

        return response()->json([
            'status' => 'success',
            'message' => 'Cita previa cancelada. Iniciando reprogramación.',
            'data' => [
                'product_id' => $productId,
                'resource_id' => $resourceId
            ]
        ]);
    }
}

