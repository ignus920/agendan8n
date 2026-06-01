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

        $tenant = auth()->user()->tenant;
        $whatsmarkCampaigns = [];

        if ($tenant && $tenant->whatsmark_instance_id) {
            try {
                $wmTenant = \Illuminate\Support\Facades\DB::connection('whatsmark')->table('tenants')
                    ->where('subdomain', $tenant->whatsmark_instance_id)
                    ->first();

                if ($wmTenant) {
                    $whatsmarkCampaigns = \Illuminate\Support\Facades\DB::connection('whatsmark')->table('campaigns')
                        ->leftJoin('whatsapp_templates', function ($join) use ($wmTenant) {
                            $join->on('campaigns.template_id', '=', 'whatsapp_templates.template_id')
                                 ->where('whatsapp_templates.tenant_id', '=', $wmTenant->id);
                        })
                        ->where('campaigns.tenant_id', $wmTenant->id)
                        ->get([
                            'campaigns.id',
                            'campaigns.name',
                            'campaigns.template_id',
                            'whatsapp_templates.template_name',
                            'whatsapp_templates.language'
                        ]);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Error loading WhatsMark campaigns: " . $e->getMessage());
            }
        }

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns,
            'contacts' => $contacts,
            'whatsmarkCampaigns' => $whatsmarkCampaigns,
            'statuses' => Campaign::STATUSES
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'whatsmark_campaign_id' => 'required|integer',
            'segment_filters' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
            'daily_limit' => 'integer|min:1',
        ]);

        $tenant = auth()->user()->tenant;
        $templateName = null;
        if ($tenant && $tenant->whatsmark_instance_id) {
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
                        ->where('campaigns.id', $request->whatsmark_campaign_id)
                        ->where('campaigns.tenant_id', $wmTenant->id)
                        ->first(['whatsapp_templates.template_name']);
                    
                    if ($wmCampaign) {
                        $templateName = $wmCampaign->template_name;
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Error fetching campaign template name from WhatsMark: " . $e->getMessage());
            }
        }

        $campaign = Campaign::create(array_merge($validated, [
            'status' => $request->filled('scheduled_at') ? 'scheduled' : 'draft',
            'template_name' => $templateName,
            'template_params' => [],
            'segment_filters' => $request->input('segment_filters', []),
        ]));

        return redirect()->back()->with('success', 'Campaña creada exitosamente.');
    }

    public function update(Request $request, Campaign $campaign)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'whatsmark_campaign_id' => 'required|integer',
            'segment_filters' => 'nullable|array',
            'scheduled_at' => 'nullable|date',
            'daily_limit' => 'integer|min:1',
            'status' => 'required|string|in:draft,scheduled,sending,sent,cancelled',
        ]);

        $tenant = auth()->user()->tenant;
        $templateName = null;
        if ($tenant && $tenant->whatsmark_instance_id) {
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
                        ->where('campaigns.id', $request->whatsmark_campaign_id)
                        ->where('campaigns.tenant_id', $wmTenant->id)
                        ->first(['whatsapp_templates.template_name']);
                    
                    if ($wmCampaign) {
                        $templateName = $wmCampaign->template_name;
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Error fetching campaign template name from WhatsMark: " . $e->getMessage());
            }
        }

        $campaign->update(array_merge($validated, [
            'template_name' => $templateName ?: $campaign->template_name,
            'template_params' => [],
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

        $tenant = auth()->user()->tenant;
        if (!$tenant || !$tenant->whatsmark_api_key || !$tenant->whatsmark_instance_id) {
            return redirect()->back()->with('error', 'Configuración de WhatsMark incompleta para el cliente.');
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
            \Illuminate\Support\Facades\Log::error("Error loading campaign from WhatsMark during send: " . $e->getMessage());
            return redirect()->back()->with('error', 'Error de conexión con la base de datos de WhatsMark.');
        }

        if (!$wmCampaign) {
            return redirect()->back()->with('error', 'No se encontró la campaña asociada en WhatsMark.');
        }

        $campaign->update(['status' => 'sending']);

        // Segment contacts based on segment_filters
        $query = Contact::query()->where('tenant_id', $campaign->tenant_id);
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
            $campaign->update(['status' => 'draft']);
            return redirect()->back()->with('error', 'No hay contactos que coincidan con los filtros seleccionados.');
        }

        // Delete previous recipients if any
        $campaign->recipients()->delete();

        $whatsmark = new \App\Services\WhatsMark\WhatsMarkService(
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

        return redirect()->back()->with('success', "Campaña enviada a {$sentCount} contactos.");
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
