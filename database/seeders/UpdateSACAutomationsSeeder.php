<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Automation;
use Illuminate\Support\Facades\DB;

class UpdateSACAutomationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = '019f514e-7924-71b2-9861-86be43bc2d1e';

        DB::transaction(function () use ($tenantId) {
            // Borrar reglas antiguas a partir de la 38 para este tenant (Demo, Fallbacks viejos)
            Automation::where('tenant_id', $tenantId)->where('id', '>=', 38)->delete();

            $newAutomations = [
                [
                    'name' => 'SAC - 4A. Mostrar Menú: Taller',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'problem_taller', 'message' => 'regex:/^[1-3]$/']),
                    'actions' => json_encode([
                        ['type' => 'update_score', 'params' => ['delta' => 30]],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Perfecto 👍\n\nNuestra plataforma ayuda a automatizar tu comunicación en WhatsApp.\n\n¿Cómo deseas continuar?\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 75
                ],
                [
                    'name' => 'SAC - 4B. Mostrar Menú: Clinica',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'problem_clinica', 'message' => 'regex:/^[1-3]$/']),
                    'actions' => json_encode([
                        ['type' => 'update_score', 'params' => ['delta' => 30]],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Perfecto 👍\n\nNuestra plataforma ayuda a automatizar tu comunicación en WhatsApp.\n\n¿Cómo deseas continuar?\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 75
                ],
                [
                    'name' => 'SAC - 4C. Mostrar Menú: Turismo',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'problem_turismo', 'message' => 'regex:/^[1-3]$/']),
                    'actions' => json_encode([
                        ['type' => 'update_score', 'params' => ['delta' => 30]],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Perfecto 👍\n\nNuestra plataforma ayuda a automatizar tu comunicación en WhatsApp.\n\n¿Cómo deseas continuar?\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 75
                ],
                [
                    'name' => 'SAC - 4D. Mostrar Menú: Otros',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'problem_otro', 'message' => 'regex:/^[1-3]$/']),
                    'actions' => json_encode([
                        ['type' => 'update_score', 'params' => ['delta' => 25]],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Perfecto 👍\n\nNuestra plataforma ayuda a automatizar tu comunicación en WhatsApp de forma integrada.\n\n¿Cómo deseas continuar?\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 70
                ],
                [
                    'name' => 'SAC - Despertar Menú Global',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['message' => 'regex:/(hola|menu|menú|volver|inicio)/i']),
                    'actions' => json_encode([
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "¡Hola de nuevo! 👋\n\n¿Cómo podemos ayudarte hoy?\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 10
                ],
                [
                    'name' => 'SAC - Opción 1: Productos',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'main_menu', 'message' => 'regex:/^(1|productos|servicios|ver)/i']),
                    'actions' => json_encode([
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Aquí tienes nuestros servicios y productos disponibles:\n\n{products_list}\n\nSi deseas agendar alguno de ellos, responde escribiendo *2* o *agendar*."]]
                    ]),
                    'priority' => 80
                ],
                [
                    'name' => 'SAC - Opción 2: Agendar (Sin Cita)',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'main_menu', 'message' => 'regex:/^(2|agendar|cita|demo)/i']),
                    'actions' => json_encode([
                        ['type' => 'update_funnel', 'params' => ['stage' => 'demo_booking_select']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Por favor responde con el número de la opción del producto/servicio que deseas agendar:\n\n{products_list}"]]
                    ]),
                    'priority' => 80
                ],
                [
                    'name' => 'SAC - Opción 2: Agendar (Con Cita)',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'qualified', 'message' => 'regex:/^(2|agendar|cita|demo)/i']),
                    'actions' => json_encode([
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Hola {contact.name}, actualmente ya tienes una cita programada para *{last_product.name}* con *{last_resource.name}*.\n\nSi deseas cambiarla, responde *reprogramar*. Si deseas cancelarla, responde *cancelar*."]]
                    ]),
                    'priority' => 85
                ],
                [
                    'name' => 'SAC - Selección Producto Numérico (n8n)',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'demo_booking_select', 'message' => 'regex:/^\d+$/']),
                    'actions' => json_encode([
                        ['type' => 'trigger_n8n', 'params' => ['webhook_url' => 'https://wfm.dosil.com.co/webhook/booking']]
                    ]),
                    'priority' => 95
                ],
                [
                    'name' => 'SAC - Opción 3: Asesor Comercial',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'main_menu', 'message' => 'regex:/^(3|asesor|humano|hablar|persona)/i']),
                    'actions' => json_encode([
                        ['type' => 'pause_bot', 'params' => ['hours' => 12]],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "He pausado el asistente automático. Un asesor comercial se comunicará contigo lo antes posible para atender tu solicitud de forma personalizada."]]
                    ]),
                    'priority' => 80
                ],
                [
                    'name' => 'SAC - Desagendar',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'qualified', 'message' => 'regex:/(cancelar|desagendar|cancelar cita|eliminar cita)/i']),
                    'actions' => json_encode([
                        ['type' => 'cancel_booking', 'params' => []],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'main_menu']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Tu cita para *{last_product.name}* ha sido cancelada correctamente. Si deseas volver al menú, responde *Hola*."]]
                    ]),
                    'priority' => 90
                ],
                [
                    'name' => 'SAC - Reprogramar',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'qualified', 'message' => 'regex:/(reprogramar|reagendar|cambiar fecha|cambiar hora)/i']),
                    'actions' => json_encode([
                        ['type' => 'reschedule_booking', 'params' => []],
                        ['type' => 'update_funnel', 'params' => ['stage' => 'demo_booking_select']],
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Iniciando reprogramación. Por favor responde con el número del servicio que deseas agendar:\n\n{products_list}"]]
                    ]),
                    'priority' => 90
                ],
                [
                    'name' => 'SAC - Fallback Menú Principal',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'main_menu']),
                    'actions' => json_encode([
                        ['type' => 'send_whatsapp', 'params' => ['message' => "No he logrado entender tu respuesta. Por favor selecciona una de las opciones del menú respondiendo con su número:\n\n1️⃣ Ver Productos / Servicios\n2️⃣ Agendar Cita o Demo\n3️⃣ Hablar con un Asesor Comercial"]]
                    ]),
                    'priority' => 1
                ],
                [
                    'name' => 'SAC - Fallback Seleccion Producto',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'demo_booking_select']),
                    'actions' => json_encode([
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Por favor selecciona una opción respondiendo únicamente con el número del producto o servicio que prefieras de la lista anterior."]]
                    ]),
                    'priority' => 1
                ],
                [
                    'name' => 'SAC - Fallback Calificado',
                    'event_type' => 'message_received',
                    'conditions' => json_encode(['contact.funnel_stage' => 'qualified']),
                    'actions' => json_encode([
                        ['type' => 'send_whatsapp', 'params' => ['message' => "Hola {contact.name}, actualmente tienes una cita programada para *{last_product.name}* con *{last_resource.name}*.\n\nSi deseas cambiarla, escribe *reprogramar*. Si deseas cancelarla, escribe *cancelar*."]]
                    ]),
                    'priority' => 1
                ]
            ];

            foreach ($newAutomations as $auto) {
                $auto['tenant_id'] = $tenantId;
                $auto['is_active'] = 1;
                $auto['cooldown_hours'] = 0;
                $auto['created_at'] = now();
                $auto['updated_at'] = now();
                Automation::insert($auto);
            }
        });
    }
}
