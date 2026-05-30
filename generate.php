<?php
$nodes = [];
$edges = [];

function addNode(&$nodes, $id, $type, $label, $x, $y) {
    $nodes[] = [
        'id' => $id,
        'type' => $type,
        'position' => ['x' => $x, 'y' => $y],
        'data' => ['label' => $label]
    ];
}

function addEdge(&$edges, $source, $target) {
    $edges[] = [
        'id' => 'e_'.$source.'_'.$target,
        'source' => $source,
        'target' => $target,
        'animated' => true
    ];
}

// 1. Menu Principal
addNode($nodes, 'n1_trigger', 'trigger', 'Mensaje: quiero mas informacion', 100, 100);
addNode($nodes, 'n1_action', 'action', 'Enviar Menu Principal (Opciones 1, 2, 3)', 400, 100);
addEdge($edges, 'n1_trigger', 'n1_action');

// Opcion 1: Productos/Servicios
addNode($nodes, 'n2_cond', 'condition', 'Opción 1: Productos', 400, 250);
addEdge($edges, 'n1_action', 'n2_cond');

addNode($nodes, 'n2_act', 'action', 'Preguntar Sector', 700, 250);
addEdge($edges, 'n2_cond', 'n2_act');

// Sector -> Problema
addNode($nodes, 'n3_cond', 'condition', 'Respuesta: 1-9 (Sector)', 700, 400);
addEdge($edges, 'n2_act', 'n3_cond');

addNode($nodes, 'n3_act', 'action', 'Preguntar Problema', 1000, 400);
addEdge($edges, 'n3_cond', 'n3_act');

// Problema -> Tamaño
addNode($nodes, 'n4_cond', 'condition', 'Respuesta: 1-4 (Problema)', 1000, 550);
addEdge($edges, 'n3_act', 'n4_cond');

addNode($nodes, 'n4_act', 'action', 'Preguntar Tamaño Empresa', 1300, 550);
addEdge($edges, 'n4_cond', 'n4_act');

// Tamaño -> Beneficios (Demo o Asesor)
addNode($nodes, 'n5_cond', 'condition', 'Respuesta: 1-3 (Tamaño)', 1300, 700);
addEdge($edges, 'n4_act', 'n5_cond');

addNode($nodes, 'n5_act', 'action', 'Ofrecer Demo o Asesor', 1600, 700);
addEdge($edges, 'n5_cond', 'n5_act');

// Demo o Asesor -> Agendar
addNode($nodes, 'n6_cond', 'condition', 'Opción 1 (Demo)', 1600, 850);
addEdge($edges, 'n5_act', 'n6_cond');

addNode($nodes, 'n6_act', 'action', 'Enviar Horarios (Booking)', 1900, 850);
addEdge($edges, 'n6_cond', 'n6_act');

// Demo o Asesor -> Asesor
addNode($nodes, 'n7_cond', 'condition', 'Opción 2 (Asesor)', 1600, 1000);
addEdge($edges, 'n5_act', 'n7_cond');

addNode($nodes, 'n7_act', 'action', 'Asignar Asesor y Pausar Bot', 1900, 1000);
addEdge($edges, 'n7_cond', 'n7_act');

// Opcion 2: Agendar Cita (Directo desde el menu)
addNode($nodes, 'n8_cond', 'condition', 'Opción 2: Agendar', 400, -50);
addEdge($edges, 'n1_action', 'n8_cond');

addNode($nodes, 'n8_act', 'action', 'Revisar Cita / Enviar Horarios', 700, -50);
addEdge($edges, 'n8_cond', 'n8_act');

// Opcion 3: Asesor (Directo desde el menu)
addNode($nodes, 'n9_cond', 'condition', 'Opción 3: Asesor', 400, 400);
addEdge($edges, 'n1_action', 'n9_cond');
addEdge($edges, 'n9_cond', 'n7_act');

file_put_contents('flow_data.json', json_encode(['nodes' => $nodes, 'edges' => $edges]));
echo "JSON generated in flow_data.json";
