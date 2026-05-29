<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenantId = '019f514e-7924-71b2-9861-86be43bc2d1e';
$contact = \App\Models\Contact::firstOrCreate(['tenant_id' => $tenantId, 'whatsapp_phone' => '123456'], ['funnel_stage' => 'main_menu']);
$contact->update(['funnel_stage' => 'main_menu']);

$engine = app(\App\Services\AutomationEngine::class);
$engine->processEvent('message_received', ['tenant_id' => $tenantId, 'message' => '1'], $contact);

echo "Done.\n";
