<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Services\WhatsMark\WhatsMarkService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncContactToWhatsMarkJob implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(protected Contact $contact)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $contact = $this->contact;
        $tenant = $contact->tenant;

        if (!$tenant || !$tenant->whatsmark_api_key || !$tenant->whatsmark_instance_id) {
            Log::info("SyncContactToWhatsMarkJob: Tenant or WhatsMark credentials missing for contact ID: {$contact->id}");
            return;
        }

        $whatsmarkService = new WhatsMarkService($tenant->whatsmark_api_key, $tenant->whatsmark_instance_id);

        $statusName = Contact::FUNNEL_STAGES[$contact->funnel_stage] ?? 'Nuevo';
        if ($contact->interest_level === 'hot' || $contact->lead_score >= 80) {
            $statusName = 'Caliente';
        }

        $sourceName = $contact->metadata['source'] ?? $contact->metadata['utm_source'] ?? 'SAC';

        $type = $contact->funnel_stage === 'customer' ? 'customer' : 'lead';

        $groups = [];
        if (!empty($contact->funnel_stage)) {
            $groups[] = Contact::FUNNEL_STAGES[$contact->funnel_stage] ?? $contact->funnel_stage;
        }
        if (!empty($contact->interest_level) && $contact->interest_level !== 'unknown') {
            $groups[] = Contact::INTEREST_LEVELS[$contact->interest_level] ?? $contact->interest_level;
        }
        if ($contact->lead_score >= 80) {
            $groups[] = 'Score Alto';
        } elseif ($contact->lead_score >= 50) {
            $groups[] = 'Score Medio';
        } else {
            $groups[] = 'Score Bajo';
        }
        if (is_array($contact->tags)) {
            foreach ($contact->tags as $tag) {
                $groups[] = $tag;
            }
        }

        $syncData = [
            'name' => $contact->name,
            'email' => $contact->email,
            'type' => $type,
            'status_name' => $statusName,
            'source_name' => $sourceName,
            'groups' => $groups,
        ];

        Log::info("SyncContactToWhatsMarkJob: Dispatching sync to WhatsMark for contact ID: {$contact->id}");
        $whatsmarkService->syncContact($contact->whatsapp_phone, $syncData);
    }
}
