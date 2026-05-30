<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\VisualFlow;
use App\Models\Tenant;

$nodes = [];
$edges = [];

function addTriggerNode(&$nodes, $id, $label, $triggerText, $x, $y) {
    $nodes[] = [
        'id' => $id,
        'type' => 'trigger',
        'position' => ['x' => $x, 'y' => $y],
        'data' => [
            'label' => $label,
            'isValid' => true,
            'output' => [[
                'reply_type_text' => 'On exact match',
                'reply_type' => '1',
                'rel_type' => 'customer',
                'trigger' => $triggerText
            ]]
        ]
    ];
}

function addTextNode(&$nodes, $id, $label, $text, $x, $y) {
    $nodes[] = [
        'id' => $id,
        'type' => 'textMessage',
        'position' => ['x' => $x, 'y' => $y],
        'data' => [
            'label' => $label,
            'isValid' => true,
            'output' => [[
                'reply_text' => $text
            ]]
        ]
    ];
}

function addEdge(&$edges, $source, $target) {
    $edges[] = [
        'id' => 'e_'.$source.'_'.$target,
        'source' => $source,
        'target' => $target,
        'animated' => true,
        'style' => ['strokeWidth' => 2]
    ];
}

// 1. Menú Principal
addTriggerNode($nodes, 'n1_trig', 'Disparador: Menú Principal', 'quiero mas informacion', 100, 100);
addTextNode($nodes, 'n1_text', 'Enviar Menú', "¡Hola {contact.name}! ¿En qué puedo ayudarte hoy?\n\n*1.* 📦 Productos y Servicios\n*2.* 📅 Agendar / Gestionar Cita\n*3.* 👤 Hablar con un Asesor Comercial", 500, 100);
addEdge($edges, 'n1_trig', 'n1_text');

// 2. Opción 1: Sector
addTriggerNode($nodes, 'n2_trig', 'Disparador: Opción 1', '1,productos,servicios,paquetes', 900, -100);
addTextNode($nodes, 'n2_text', 'Preguntar Sector', "¡Excelente! Para darte la información correcta, cuéntame: ¿A qué sector pertenece tu empresa?\n\n*1.* 🚗 Talleres Automotrices\n*2.* 🏥 Clínicas y Consultorios...", 1300, -100);
addEdge($edges, 'n1_text', 'n2_trig'); // Just visualizing flow linearly
addEdge($edges, 'n2_trig', 'n2_text');

// 2.1 Problema
addTriggerNode($nodes, 'n3_trig', 'Disparador: Sector 1-9', '1,2,3,4,5,6,7,8,9', 1700, -100);
addTextNode($nodes, 'n3_text', 'Preguntar Problema', "Entendido. ¿Cuál es el desafío principal que enfrentas en tu negocio hoy?\n\n*1.* ⏳ Me demoro en responder y pierdo clientes...", 2100, -100);
addEdge($edges, 'n2_text', 'n3_trig');
addEdge($edges, 'n3_trig', 'n3_text');

// 3. Opción 2: Agendar
addTriggerNode($nodes, 'n4_trig', 'Disparador: Opción 2', '2,agendar', 900, 300);
addTextNode($nodes, 'n4_text', 'Enviar Horarios', "Te enviaré el enlace para que elijas el horario de tu cita.", 1300, 300);
addEdge($edges, 'n1_text', 'n4_trig');
addEdge($edges, 'n4_trig', 'n4_text');

// 10. Opción 3: Asesor
addTriggerNode($nodes, 'n5_trig', 'Disparador: Opción 3', '3,asesor', 900, 500);
addTextNode($nodes, 'n5_text', 'Asignar Asesor', "En unos momentos un asesor comercial se comunicará contigo. Por favor, mantente en línea...", 1300, 500);
addEdge($edges, 'n1_text', 'n5_trig');
addEdge($edges, 'n5_trig', 'n5_text');

$flowData = [
    'nodes' => $nodes,
    'edges' => $edges
];

VisualFlow::create([
    'tenant_id' => Tenant::first()->id,
    'name' => 'Flujo SAC (Advanced React Flow)',
    'description' => 'Generado internamente por el sistema',
    'is_active' => true,
    'flow_data' => $flowData
]);

echo "Flujo insertado correctamente en la BD usando Laravel.\n";
