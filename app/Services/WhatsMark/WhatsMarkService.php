<?php

namespace App\Services\WhatsMark;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsMarkService
{
    protected ?string $apiKey;
    protected ?string $instanceId;
    protected string $baseUrl;

    public function __construct(?string $apiKey = null, ?string $instanceId = null)
    {
        $this->apiKey = $apiKey ?: config('services.whatsmark.default_api_key');
        $this->instanceId = $instanceId;
        $this->baseUrl = config('services.whatsmark.url', 'https://chat.dosil.com.co/');
    }

    /**
     * Send a WhatsApp message.
     */
    public function sendMessage(string $phone, string $message): ?string
    {
        try {
            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/messages';
            
            $payload = [
                'phone' => $phone,
                'message' => $message,
            ];
            
            if ($this->instanceId) {
                $payload['instance_id'] = $this->instanceId;
            }

            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->post($endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['message_id'] ?? $data['id'] ?? 'success';
            }

            Log::error("WhatsMark sendMessage failed. Status: {$response->status()}, Response: {$response->body()}");
            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark sendMessage exception: {$e->getMessage()}", [
                'phone' => $phone,
                'message' => $message
            ]);
            return null;
        }
    }

    /**
     * Send a WhatsApp template message (Meta official template).
     */
    public function sendTemplate(string $phone, string $template, array $params = []): ?string
    {
        try {
            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/templates';
            
            $payload = [
                'phone' => $phone,
                'template_name' => $template,
                'params' => $params,
            ];
            
            if ($this->instanceId) {
                $payload['instance_id'] = $this->instanceId;
            }

            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->post($endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['message_id'] ?? $data['id'] ?? 'success';
            }

            Log::error("WhatsMark sendTemplate failed. Status: {$response->status()}, Response: {$response->body()}");
            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark sendTemplate exception: {$e->getMessage()}", [
                'phone' => $phone,
                'template' => $template,
                'params' => $params
            ]);
            return null;
        }
    }
}
