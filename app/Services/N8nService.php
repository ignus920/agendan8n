<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nService
{
    /**
     * Trigger an n8n workflow by sending a POST request to the webhook URL.
     */
    public function triggerWorkflow(string $webhookUrl, array $payload): bool
    {
        try {
            $apiKey = config('services.n8n.api_key');
            
            $request = Http::timeout(10);
            
            if ($apiKey) {
                $request = $request->withHeaders([
                    'X-N8N-API-KEY' => $apiKey,
                ]);
            }

            $response = $request->post($webhookUrl, $payload);

            if ($response->successful()) {
                return true;
            }

            Log::error("N8nService trigger failed. Status: {$response->status()}, Response: {$response->body()}");
            return false;
        } catch (\Throwable $e) {
            Log::error("N8nService exception: {$e->getMessage()}", [
                'webhook_url' => $webhookUrl,
                'payload' => $payload
            ]);
            return false;
        }
    }
}
