<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Automation;

class FixMenuSeeder extends Seeder
{
    public function run()
    {
        // Update Opcion 1 to do the same as Opcion 2, moving them to demo_booking_select
        Automation::where('name', 'SAC - Opción 1: Productos')->update([
            'conditions' => json_encode(['contact.funnel_stage' => 'main_menu', 'message' => 'regex:/^(1|productos|servicios|ver)/i']),
            'actions' => json_encode([
                ['type' => 'update_funnel', 'params' => ['stage' => 'demo_booking_select']],
                ['type' => 'send_whatsapp', 'params' => ['message' => "Aquí tienes nuestros servicios disponibles:\n\n{products_list}\n\nPara continuar y agendar, por favor responde únicamente con el *número* del servicio que te interesa (ejemplo: 1).\n\nSi sólo querías mirar, ¡no hay problema! Escribe *Menú* para volver."]]
            ])
        ]);

        // Update Opcion 2 to just use the exact same logic (they are basically synonymous now)
        Automation::where('name', 'SAC - Opción 2: Agendar')->update([
            'conditions' => json_encode(['contact.funnel_stage' => 'main_menu', 'message' => 'regex:/^(2|agendar|cita|demo|reunion)/i']),
            'actions' => json_encode([
                ['type' => 'update_funnel', 'params' => ['stage' => 'demo_booking_select']],
                ['type' => 'send_whatsapp', 'params' => ['message' => "¡Excelente! Para poder agendar, necesito que elijas uno de nuestros servicios:\n\n{products_list}\n\nPor favor responde únicamente con el *número* del servicio que te interesa (ejemplo: 1)."]]
            ])
        ]);
    }
}
