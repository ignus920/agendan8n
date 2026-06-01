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

        $customVariables = [
            'lead_score' => $contact->lead_score,
            'funnel_stage' => $contact->funnel_stage,
            'funnel_stage_name' => Contact::FUNNEL_STAGES[$contact->funnel_stage] ?? $contact->funnel_stage,
            'interest_level' => $contact->interest_level,
            'interest_level_name' => Contact::INTEREST_LEVELS[$contact->interest_level] ?? $contact->interest_level,
            'bot_paused' => $contact->bot_paused ? 'yes' : 'no',
        ];

        $tags = is_array($contact->tags) ? $contact->tags : [];

        $syncData = [
            'name' => $contact->name,
            'email' => $contact->email,
            'tags' => $tags,
            'custom_variables' => $customVariables,
        ];

        Log::info("SyncContactToWhatsMarkJob: Dispatching sync to WhatsMark for contact ID: {$contact->id}");
        $whatsmarkService->syncContact($contact->whatsapp_phone, $syncData);
    }
}
