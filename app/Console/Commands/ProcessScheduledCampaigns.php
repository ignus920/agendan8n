<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Campaign;
use App\Models\Contact;
use App\Models\CampaignRecipient;
use App\Services\WhatsMark\WhatsMarkService;
use Illuminate\Support\Facades\Log;

class ProcessScheduledCampaigns extends Command
{
    protected $signature = 'campaigns:process-scheduled';
    protected $description = 'Process and send scheduled campaigns that are due';

    public function handle()
    {
        $campaigns = Campaign::where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($campaigns as $campaign) {
            $this->info("Processing campaign ID: {$campaign->id}");
            $campaign->update(['status' => 'sending']);

            $query = Contact::query()->where('tenant_id', $campaign->tenant_id);
            $filters = $campaign->segment_filters ?? [];

            if (!empty($filters['funnel_stage'])) {
                $query->where('funnel_stage', $filters['funnel_stage']);
            }
            if (!empty($filters['interest_level'])) {
                $query->where('interest_level', $filters['interest_level']);
            }
            if (!empty($filters['tag'])) {
                $query->whereJsonContains('tags', $filters['tag']);
            }
            if (isset($filters['min_score']) && $filters['min_score'] !== '') {
                $query->where('lead_score', '>=', (int) $filters['min_score']);
            }
            if (isset($filters['max_score']) && $filters['max_score'] !== '') {
                $query->where('lead_score', '<=', (int) $filters['max_score']);
            }
            if (isset($filters['inactive_days']) && $filters['inactive_days'] !== '') {
                $days = (int) $filters['inactive_days'];
                $query->whereDoesntHave('interactions', function($q) use ($days) {
                    $q->where('created_at', '>=', now()->subDays($days));
                });
            }

            $contacts = $query->get();

            if ($contacts->isEmpty()) {
                $campaign->update(['status' => 'sent', 'sent_count' => 0, 'delivered_count' => 0]);
                continue;
            }

            $campaign->recipients()->delete();

            $tenant = $campaign->tenant;
            if (!$tenant || !$tenant->whatsmark_api_key || !$tenant->whatsmark_instance_id) {
                Log::error("Campaign {$campaign->id} failed: Tenant or WhatsMark config missing.");
                $campaign->update(['status' => 'cancelled']);
                continue;
            }

            $whatsmark = new WhatsMarkService(
                $tenant->whatsmark_api_key,
                $tenant->whatsmark_instance_id
            );

            $sentCount = 0;
            $deliveredCount = 0;

            foreach ($contacts as $contact) {
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
                'read_count' => 0,
            ]);
            
            $this->info("Campaign {$campaign->id} sent to {$sentCount} contacts.");
        }
    }
}
