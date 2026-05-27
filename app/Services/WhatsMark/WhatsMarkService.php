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
            if (!$this->instanceId) {
                Log::error("WhatsMark sendMessage failed: No instance_id provided.");
                return null;
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/messages/send';
            
            $payload = [
                'phone_number' => $phone,
                'message_body' => $message,
            ];
            
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
            if (!$this->instanceId) {
                Log::error("WhatsMark sendTemplate failed: No instance_id provided.");
                return null;
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/templates/send';
            
            $payload = [
                'phone_number' => $phone,
                'template_name' => $template,
                'params' => $params,
            ];

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

    /**
     * Get all WhatsApp message templates from WhatsMark.
     */
    public function getTemplates(): array
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark getTemplates failed: No instance_id provided.");
                return [];
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/templates';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                // Return templates array from paginated response
                return $data['data']['data'] ?? $data['data'] ?? [];
            }

            Log::error("WhatsMark getTemplates failed. Status: {$response->status()}, Response: {$response->body()}");
            return [];
        } catch (\Throwable $e) {
            Log::error("WhatsMark getTemplates exception: {$e->getMessage()}");
            return [];
        }
    }
}
