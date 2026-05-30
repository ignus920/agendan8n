<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\VisualFlow;
use App\Models\Tenant;

$json = file_get_contents('flow_data.json');
$data = json_decode($json, true);

VisualFlow::create([
    'tenant_id' => Tenant::first()->id,
    'name' => 'Perfilamiento Completo (Ejemplo)',
    'description' => 'Mapeo del flujo de ventas y perfilamiento.',
    'is_active' => true,
    'flow_data' => $data
]);

echo 'Flujo complejo creado';
