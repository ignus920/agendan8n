<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Automation;
use Illuminate\Database\Seeder;

class DemoAutomationSeeder extends Seeder
{
    public function run(?string $tenantId = null): void
    {
        if (!$tenantId) {
            // Find the first tenant
            $tenant = Tenant::first();
            if (!$tenant) {
                return;
            }
            $tenantId = $tenant->id;
        }

        // 1. Welcome New Leads
        Automation::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'name' => 'Bienvenida a Nuevos Leads',
            ],
            [
                'event_type' => 'message_received',
                'conditions' => ['contact.funnel_stage' => 'new'],
                'actions' => [
                    [
                        'type' => 'update_funnel',
                        'params' => [
                            'stage' => 'interested'
                        ]
                    ],
                    [
                        'type' => 'update_score',
                        'params' => [
                            'delta' => 10
                        ]
                    ],
                    [
                        'type' => 'send_whatsapp',
                        'params' => [
                            'message' => '¡Hola! Bienvenido a nuestro SAC Autónomo. ¿En qué producto o servicio estás interesado hoy?'
                        ]
                    ]
                ],
                'is_active' => true,
                'priority' => 1,
                'cooldown_hours' => 1,
            ]
        );

        // 2. Trigger n8n Workflow on Booking
        Automation::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'name' => 'Disparar Flujo n8n en Booking',
            ],
            [
                'event_type' => 'booking_created',
                'conditions' => [],
                'actions' => [
                    [
                        'type' => 'trigger_n8n',
                        'params' => [] // Will use default n8n_webhook_url from tenant
                    ]
                ],
                'is_active' => true,
                'priority' => 2,
                'cooldown_hours' => 0,
            ]
        );

        // 3. Intención de Precios -> Incrementar Score e IA
        Automation::updateOrCreate(
            [
                'tenant_id' => $tenantId,
                'name' => 'Interés en Precios',
            ],
            [
                'event_type' => 'message_received',
                'conditions' => [], // Evaluated dynamically or simple
                'actions' => [
                    [
                        'type' => 'update_score',
                        'params' => [
                            'delta' => 15
                        ]
                    ]
                ],
                'is_active' => true,
                'priority' => 3,
                'cooldown_hours' => 0,
            ]
        );
    }
}
