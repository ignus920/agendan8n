<?php

// Script interactivo para probar el SAC Autónomo directamente en producción (VPS)
// Ejecutar con: php test_webhook.php

$url = 'https://sac.dosil.com.co/api/v1/webhook/events';
$instanceId = 'inst_demo_98765'; // Cambia esto por tu whatsmark_instance_id real en el VPS si es diferente

echo "=========================================================\n";
echo "       PROBADOR DE FLUJOS SAC AUTÓNOMO (PRODUCCIÓN)       \n";
echo "=========================================================\n";
echo "Selecciona el flujo comercial que deseas simular en el VPS:\n\n";
echo "[1] Mensaje Nuevo (Lead Scoring + Movimiento de Embudo)\n";
echo "    -> Simula un cliente escribiendo por primera vez.\n\n";
echo "[2] Inactividad de Lead (Seguimiento / Rescate)\n";
echo "    -> Simula que un lead calificado lleva 24h sin actividad.\n\n";
echo "[3] Alerta de Recompra Vencida (Fidelización)\n";
echo "    -> Simula el vencimiento del periodo de recompra de un cliente.\n\n";
echo "[4] Cita Confirmada (Cierre de Venta)\n";
echo "    -> Simula el agendamiento exitoso de una cita.\n\n";
echo "=========================================================\n";
echo "Elige una opción (1-4): ";

$handle = fopen("php://stdin","r");
$option = trim(fgets($handle));

$payload = [
    'instance_id' => $instanceId,
    'phone' => '+573999999999',
    'name' => 'Cliente de Prueba SAC',
];

switch ($option) {
    case '1':
        $payload['event_type'] = 'message_received';
        $payload['message'] = 'Hola, quiero saber el costo de un desarrollo MVP';
        $payload['direction'] = 'inbound';
        echo "\nSimulando Entrada de Lead (Score + Embudo)...\n";
        break;
        
    case '2':
        $payload['event_type'] = 'lead_inactive';
        $payload['message'] = '';
        $payload['direction'] = 'inbound';
        echo "\nSimulando Alerta de Inactividad (Seguimiento)...\n";
        break;
        
    case '3':
        $payload['event_type'] = 'repurchase_due';
        $payload['message'] = '';
        $payload['direction'] = 'outbound';
        echo "\nSimulando Vencimiento de Recompra (Reactivación)...\n";
        break;

    case '4':
        $payload['event_type'] = 'booking_created';
        $payload['message'] = 'Cita agendada para el lunes a las 10:00 AM';
        $payload['direction'] = 'outbound';
        echo "\nSimulando Cita Confirmada (Cierre)...\n";
        break;

    default:
        echo "Opción inválida. Saliendo.\n";
        exit;
}

echo "Enviando payload a: {$url}...\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo 'Error en CURL: ' . curl_error($ch) . "\n";
} else {
    echo "\nCódigo HTTP de Respuesta VPS: {$httpCode}\n";
    echo "Cuerpo de Respuesta:\n";
    
    $decoded = json_decode($response);
    if ($decoded) {
        echo json_encode($decoded, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo $response . "\n";
    }
}

curl_close($ch);
echo "\nVerifica el resultado en tu Panel del VPS:\n";
echo "- Revisa 'Contactos' para ver los cambios de score/funnel.\n";
echo "- Revisa 'Automatizaciones' -> Log de Ejecuciones para ver las acciones tomadas.\n";
