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

            // Fetch WhatsMark campaign details
            $wmCampaign = null;
            try {
                $wmTenant = \Illuminate\Support\Facades\DB::connection('whatsmark')->table('tenants')
                    ->where('subdomain', $tenant->whatsmark_instance_id)
                    ->first();

                if ($wmTenant) {
                    $wmCampaign = \Illuminate\Support\Facades\DB::connection('whatsmark')->table('campaigns')
                        ->leftJoin('whatsapp_templates', function ($join) use ($wmTenant) {
                            $join->on('campaigns.template_id', '=', 'whatsapp_templates.template_id')
                                 ->where('whatsapp_templates.tenant_id', '=', $wmTenant->id);
                        })
                        ->where('campaigns.id', $campaign->whatsmark_campaign_id)
                        ->where('campaigns.tenant_id', $wmTenant->id)
                        ->first([
                            'campaigns.id',
                            'campaigns.name',
                            'campaigns.template_id',
                            'whatsapp_templates.template_name',
                            'whatsapp_templates.language',
                            'campaigns.header_params',
                            'campaigns.body_params',
                            'campaigns.footer_params'
                        ]);
                }
            } catch (\Throwable $e) {
                Log::error("Error loading campaign {$campaign->whatsmark_campaign_id} from WhatsMark during scheduled execution: " . $e->getMessage());
                $campaign->update(['status' => 'cancelled']);
                continue;
            }

            if (!$wmCampaign) {
                Log::error("Campaign {$campaign->id} failed: WhatsMark campaign not found.");
                $campaign->update(['status' => 'cancelled']);
                continue;
            }

            $whatsmark = new WhatsMarkService(
                $tenant->whatsmark_api_key,
                $tenant->whatsmark_instance_id
            );

            $headerParams = json_decode($wmCampaign->header_params, true) ?: [];
            $bodyParams = json_decode($wmCampaign->body_params, true) ?: [];
            $footerParams = json_decode($wmCampaign->footer_params, true) ?: [];

            $sentCount = 0;
            $deliveredCount = 0;

            foreach ($contacts as $contact) {
                // Resolve placeholders in template parameters for this contact
                $resolvedBodyParams = [];
                foreach ($bodyParams as $paramValue) {
                    $resolvedBodyParams[] = $this->parsePlaceholders($paramValue, $contact);
                }

                $resolvedHeaderParams = [];
                foreach ($headerParams as $paramValue) {
                    $resolvedHeaderParams[] = $this->parsePlaceholders($paramValue, $contact);
                }

                $resolvedFooterParams = [];
                foreach ($footerParams as $paramValue) {
                    $resolvedFooterParams[] = $this->parsePlaceholders($paramValue, $contact);
                }

                // Call WhatsMark API to send the template message
                $messageId = $whatsmark->sendTemplate(
                    $contact->whatsapp_phone,
                    $wmCampaign->template_name,
                    $resolvedBodyParams,
                    $resolvedHeaderParams,
                    $resolvedFooterParams
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

    /**
     * Parse dynamic placeholders in template parameters.
     */
    protected function parsePlaceholders(string $message, Contact $contact): string
    {
        // 1. Replace contact placeholders
        $message = str_replace('{contact.name}', $contact->name ?? 'Cliente', $message);
        $message = str_replace('{contact.phone}', $contact->whatsapp_phone, $message);
        $message = str_replace('{contact.lead_score}', $contact->lead_score, $message);
        
        // Also support just {name} and {phone}
        $message = str_replace('{name}', $contact->name ?? 'Cliente', $message);
        $message = str_replace('{phone}', $contact->whatsapp_phone, $message);

        // 2. Replace {products_list} placeholder with dynamic DB products
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
                }
            }
            $message = str_replace('{products_list}', trim($list), $message);
        }

        return $message;
    }
}
