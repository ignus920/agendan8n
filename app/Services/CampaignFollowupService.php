<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\AutomationLog;
use Illuminate\Support\Facades\Log;

class CampaignFollowupService
{
    public const CAMPAIGN_MAP = [
        'contact_created' => 'Campaña de Bienvenida y Calificación Automática',
        'funnel_stage.new' => 'Campaña de Bienvenida y Calificación Automática',
        'funnel_stage.interested' => 'Campaña de Nutrición de Leads y Contenido de Valor',
        'funnel_stage.qualified' => 'Campaña de Agendamiento de Citas de Ventas',
        'funnel_stage.negotiation' => 'Campaña de Seguimiento de Propuesta y Cierre',
        'funnel_stage.customer' => 'Campaña de Post-venta, Fidelización y Recompra',
        'funnel_stage.lost' => 'Campaña de Reactivación y Rescate de Leads Perdidos',
        'booking_created' => 'Campaña de Confirmación y Recordatorio de Cita',
        'booking_cancelled' => 'Campaña de Recuperación de Cita Cancelada',
        'repurchase_due' => 'Campaña de Reactivación por Periodo de Recompra',
        'lead_inactive' => 'Campaña de Rescate por Inactividad de Lead',
    ];

    public function __construct(protected AutomationEngine $automationEngine)
    {
    }

    /**
     * Associate a campaign to a contact based on an event or state.
     */
    public function associateCampaign(Contact $contact, string $eventType, array $payload = []): void
    {
        $campaignName = $this->getMappedCampaign($eventType, $payload);

        if (!$campaignName) {
            return;
        }

        Log::info("CampaignFollowupService: Associating campaign '{$campaignName}' for contact ID: {$contact->id} on event '{$eventType}'");

        // 1. Create a log entry in automation_logs showing campaign association
        AutomationLog::create([
            'automation_id' => null,
            'tenant_id' => $contact->tenant_id,
            'contact_id' => $contact->id,
            'event_type' => 'campaign_assigned',
            'event_payload' => array_merge($payload, [
                'trigger_event' => $eventType,
                'campaign_name' => $campaignName,
            ]),
            'actions_executed' => [
                'description' => "Campaña de seguimiento iniciada: '{$campaignName}'",
                'campaign_name' => $campaignName,
            ],
            'status' => 'success',
            'executed_at' => now(),
        ]);

        // 2. Trigger the "campaign_started" event in the AutomationEngine
        $eventPayload = [
            'tenant_id' => $contact->tenant_id,
            'campaign_name' => $campaignName,
            'trigger_event' => $eventType,
            'contact_id' => $contact->id,
        ];

        $this->automationEngine->processEvent('campaign_started', $eventPayload, $contact);
    }

    /**
     * Resolve the mapped campaign name based on event type and payload.
     */
    protected function getMappedCampaign(string $eventType, array $payload): ?string
    {
        if ($eventType === 'funnel_stage_changed') {
            $newStage = $payload['to'] ?? null;
            if ($newStage) {
                return self::CAMPAIGN_MAP["funnel_stage.{$newStage}"] ?? null;
            }
        }

        return self::CAMPAIGN_MAP[$eventType] ?? null;
    }
}
