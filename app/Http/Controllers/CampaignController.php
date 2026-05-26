<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\CampaignRecipient;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CampaignController extends Controller
{
    public function index()
    {
        $campaigns = Campaign::withCount('recipients')
            ->orderByDesc('created_at')
            ->get();

        $contacts = Contact::get(['id', 'name', 'funnel_stage', 'tags', 'interest_level']);

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'contacts' => $contacts,
            'statuses' => Campaign::STATUSES
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_name' => 'required|string|max:255',
            'template_params' => 'nullable|array',
            'segment_filters' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
            'daily_limit' => 'integer|min:1',
        ]);

        $campaign = Campaign::create(array_merge($validated, [
            'status' => $request->filled('scheduled_at') ? 'scheduled' : 'draft',
            'template_params' => $request->input('template_params', []),
            'segment_filters' => $request->input('segment_filters', []),
        ]));

        return redirect()->back()->with('success', 'Campaña creada exitosamente.');
    }

    public function update(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'template_name' => 'required|string|max:255',
            'template_params' => 'nullable|array',
            'segment_filters' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
            'daily_limit' => 'integer|min:1',
            'status' => 'required|string|in:draft,scheduled,sending,sent,cancelled',
        ]);

        $campaign->update(array_merge($validated, [
            'template_params' => $request->input('template_params', []),
            'segment_filters' => $request->input('segment_filters', []),
        ]));

        return redirect()->back()->with('success', 'Campaña actualizada exitosamente.');
    }

    public function destroy(Campaign $campaign)
    {
        $campaign->delete();

        return redirect()->back()->with('success', 'Campaña eliminada exitosamente.');
    }

    public function send(Campaign $campaign)
    {
        if ($campaign->status === 'sent') {
            return redirect()->back()->with('error', 'Esta campaña ya fue enviada.');
        }

        $campaign->update(['status' => 'sending']);

        // Segment contacts based on segment_filters
        $query = Contact::query();
        $filters = $campaign->segment_filters;

        if (!empty($filters['funnel_stage'])) {
            $query->where('funnel_stage', $filters['funnel_stage']);
        }
        if (!empty($filters['interest_level'])) {
            $query->where('interest_level', $filters['interest_level']);
        }
        if (!empty($filters['tag'])) {
            $query->whereJsonContains('tags', $filters['tag']);
        }

        $contacts = $query->get();

        if ($contacts->isEmpty()) {
            $campaign->update(['status' => 'draft']);
            return redirect()->back()->with('error', 'No hay contactos que coincidan con los filtros seleccionados.');
        }

        // Delete previous recipients if any
        $campaign->recipients()->delete();

        $tenant = auth()->user()->tenant;
        $whatsmark = new \App\Services\WhatsMark\WhatsMarkService(
            $tenant->whatsmark_api_key,
            $tenant->whatsmark_instance_id
        );

        $sentCount = 0;
        $deliveredCount = 0;

        foreach ($contacts as $contact) {
            // Call WhatsMark API to send the template message
            $messageId = $whatsmark->sendTemplate(
                $contact->whatsapp_phone,
                $campaign->template_name,
                $campaign->template_params ?: []
            );

            $isDelivered = !empty($messageId);

            CampaignRecipient::create([
                'campaign_id' => $campaign->id,
                'contact_id' => $contact->id,
                'status' => $isDelivered ? 'sent' : 'failed',
                'sent_at' => now(),
                'error_message' => $isDelivered ? null : 'Error al enviar plantilla a WhatsMark',
            ]);

            if ($isDelivered) {
                $sentCount++;
                $deliveredCount++;
            }
        }

        $campaign->update([
            'status' => 'sent',
            'sent_count' => $sentCount,
            'delivered_count' => $deliveredCount,
            'read_count' => 0, // Read count will be updated via inbound webhook when read receipt is received
        ]);

        return redirect()->back()->with('success', "Campaña enviada a {$sentCount} contactos.");
    }
}
