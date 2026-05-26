<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Resource;
use App\Models\Contact;
use App\Models\Booking;
use App\Models\Automation;
use App\Services\LeadScoringService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Tenant
        $tenant = Tenant::create([
            'name' => 'WhatsMark Demo Store',
            'slug' => 'whatsmark',
            'whatsapp_number' => '+573000000000',
            'whatsmark_api_key' => 'wm_demo_key_12345',
            'whatsmark_instance_id' => 'inst_demo_98765',
            'n8n_webhook_url' => 'http://wfm.dosil.com.co/webhook/demo',
            'ai_provider' => 'openrouter',
            'ai_model' => 'google/gemini-2.0-flash',
            'timezone' => 'America/Bogota',
            'settings' => [
                'theme' => 'dark',
                'auto_decay_enabled' => true
            ],
            'is_active' => true,
        ]);

        // 2. Create User
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Demo Administrator',
            'email' => 'admin@dosil.com',
            'password' => Hash::make('password'),
            'role' => 'tenant_admin',
            'is_active' => true,
        ]);

        // 3. Create Resources
        $res1 = Resource::create([
            'tenant_id' => $tenant->id,
            'name' => 'Juan Pérez (Asesor Comercial)',
            'type' => 'person',
            'description' => 'Especialista en consultoría y ventas de software.',
            'capacity' => 1,
            'is_active' => true,
            'metadata' => ['whatsapp' => '+573111111111'],
        ]);

        $res2 = Resource::create([
            'tenant_id' => $tenant->id,
            'name' => 'Sala de Reunión Virtual',
            'type' => 'room',
            'description' => 'Sesión virtual por Google Meet o Zoom.',
            'capacity' => 5,
            'is_active' => true,
            'metadata' => ['url' => 'https://meet.google.com/abc-defg-hij'],
        ]);

        // Seed weekly schedules (Monday-Friday 09:00 - 18:00)
        for ($day = 1; $day <= 5; $day++) {
            \App\Models\ResourceSchedule::create([
                'resource_id' => $res1->id,
                'tenant_id' => $tenant->id,
                'day_of_week' => $day,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);

            \App\Models\ResourceSchedule::create([
                'resource_id' => $res2->id,
                'tenant_id' => $tenant->id,
                'day_of_week' => $day,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_active' => true,
            ]);
        }

        // 4. Create Products
        $prod1 = Product::create([
            'tenant_id' => $tenant->id,
            'name' => 'Desarrollo de Software MVP',
            'description' => 'Creación rápida de producto mínimo viable en 4 semanas.',
            'price' => 1500.00,
            'duration_minutes' => 60,
            'repurchase_frequency_days' => 60,
            'tags' => ['mvp', 'desarrollo', 'startup'],
            'is_featured' => true,
            'status' => 'active',
        ]);

        $prod2 = Product::create([
            'tenant_id' => $tenant->id,
            'name' => 'Mantenimiento Mensual Cloud',
            'description' => 'Soporte y optimización mensual de servidores y base de datos.',
            'price' => 250.00,
            'duration_minutes' => 30,
            'repurchase_frequency_days' => 30,
            'tags' => ['soporte', 'cloud', 'mensual'],
            'is_featured' => true,
            'status' => 'active',
        ]);

        // 5. Create Default Scoring Rules
        LeadScoringService::createDefaultRules($tenant->id);

        // 6. Create Contacts
        $c1 = Contact::create([
            'tenant_id' => $tenant->id,
            'whatsapp_phone' => '+573219876543',
            'name' => 'Carlos Mendoza',
            'email' => 'carlos@gmail.com',
            'lead_score' => 85,
            'funnel_stage' => 'qualified',
            'interest_level' => 'hot',
            'assigned_user_id' => $user->id,
            'tags' => ['interesado_mvp', 'web_inquiry'],
            'last_product_id' => null,
            'last_purchase_at' => null,
            'next_repurchase_at' => null,
            'bot_paused' => false,
            'metadata' => ['city' => 'Bogotá', 'company' => 'Mendoza Tech'],
        ]);

        $c2 = Contact::create([
            'tenant_id' => $tenant->id,
            'whatsapp_phone' => '+573102223344',
            'name' => 'Diana Restrepo',
            'email' => 'diana@outlook.com',
            'lead_score' => 95,
            'funnel_stage' => 'customer',
            'interest_level' => 'hot',
            'assigned_user_id' => $user->id,
            'tags' => ['cliente_activo', 'vip'],
            'last_product_id' => $prod2->id,
            'last_purchase_at' => now()->subDays(15),
            'next_repurchase_at' => now()->addDays(15),
            'bot_paused' => false,
            'metadata' => ['city' => 'Medellín'],
        ]);

        $c3 = Contact::create([
            'tenant_id' => $tenant->id,
            'whatsapp_phone' => '+573155556677',
            'name' => 'Alberto Gómez',
            'email' => 'alberto@gmail.com',
            'lead_score' => 45,
            'funnel_stage' => 'interested',
            'interest_level' => 'medium',
            'assigned_user_id' => null,
            'tags' => ['consulta_precio'],
            'last_product_id' => null,
            'last_purchase_at' => null,
            'next_repurchase_at' => null,
            'bot_paused' => false,
            'metadata' => ['city' => 'Cali'],
        ]);

        $c4 = Contact::create([
            'tenant_id' => $tenant->id,
            'whatsapp_phone' => '+573007778899',
            'name' => 'Sofía Ramírez',
            'email' => 'sofia@empresa.com',
            'lead_score' => 15,
            'funnel_stage' => 'lost',
            'interest_level' => 'low',
            'assigned_user_id' => null,
            'tags' => ['rescate_pendiente'],
            'last_product_id' => null,
            'last_purchase_at' => null,
            'next_repurchase_at' => null,
            'bot_paused' => false,
            'metadata' => ['reason' => 'Sin respuesta después de cotizar'],
        ]);

        // 7. Create Bookings
        Booking::create([
            'tenant_id' => $tenant->id,
            'contact_id' => $c1->id,
            'resource_id' => $res1->id,
            'product_id' => $prod1->id,
            'assigned_user_id' => $user->id,
            'title' => 'Reunión de Requisitos MVP',
            'starts_at' => now()->addDays(2)->setHour(10)->setMinute(0)->setSecond(0),
            'ends_at' => now()->addDays(2)->setHour(11)->setMinute(0)->setSecond(0),
            'status' => 'confirmed',
            'notes' => 'El cliente quiere discutir la integración con pasarela de pagos.',
            'source' => 'whatsapp',
        ]);

        Booking::create([
            'tenant_id' => $tenant->id,
            'contact_id' => $c3->id,
            'resource_id' => $res2->id,
            'product_id' => null,
            'assigned_user_id' => null,
            'title' => 'Consultoría Inicial Gratis',
            'starts_at' => now()->addDays(4)->setHour(15)->setMinute(0)->setSecond(0),
            'ends_at' => now()->addDays(4)->setHour(15)->setMinute(30)->setSecond(0),
            'status' => 'pending',
            'notes' => 'Interesado en conocer precios corporativos.',
            'source' => 'web',
        ]);

        // 8. Create Automations
        Automation::create([
            'tenant_id' => $tenant->id,
            'name' => 'Bienvenida a Nuevos Leads',
            'event_type' => 'message_received',
            'conditions' => ['contact.funnel_stage' => 'new'],
            'actions' => [
                [
                    'type' => 'send_whatsapp',
                    'params' => [
                        'message' => '¡Hola! Bienvenido a WhatsMark Demo. ¿Cómo podemos ayudarte hoy? Escribe "servicios" para conocer nuestro catálogo.'
                    ]
                ]
            ],
            'is_active' => true,
            'priority' => 1,
            'cooldown_hours' => 12,
        ]);

        Automation::create([
            'tenant_id' => $tenant->id,
            'name' => 'Disparar Flujo n8n en Calificado',
            'event_type' => 'booking_created',
            'conditions' => [],
            'actions' => [
                [
                    'type' => 'trigger_n8n',
                    'params' => [
                        'webhook_url' => 'http://wfm.dosil.com.co/webhook/demo'
                    ]
                ]
            ],
            'is_active' => true,
            'priority' => 2,
            'cooldown_hours' => 0,
        ]);
    }
}
