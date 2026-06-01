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
    public function sendTemplate(string $phone, string $template, array $params = [], array $headerParams = [], array $buttonParams = []): ?string
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark sendTemplate failed: No instance_id provided.");
                return null;
            }

            // Find the template language
            $templates = $this->getTemplates();
            $language = 'es'; // default
            foreach ($templates as $t) {
                if (($t['template_name'] ?? '') === $template) {
                    $language = $t['language'] ?? 'es';
                    break;
                }
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/messages/template';
            
            $payload = [
                'phone_number' => $phone,
                'template_name' => $template,
                'template_language' => $language,
            ];

            // Map header parameters
            if (!empty($headerParams)) {
                $i = 1;
                foreach ($headerParams as $hParam) {
                    $payload["header_field_{$i}"] = $hParam;
                    $i++;
                }
            }

            // Map body parameters
            if (!empty($params)) {
                // If it is already an associative array with field keys, merge directly
                if (isset($params['field_1']) || isset($params['header_field_1'])) {
                    $payload = array_merge($payload, $params);
                } else {
                    $i = 1;
                    foreach ($params as $param) {
                        $payload["field_{$i}"] = $param;
                        $i++;
                    }
                }
            }

            // Map button parameters
            if (!empty($buttonParams)) {
                $i = 0;
                foreach ($buttonParams as $bParam) {
                    $payload["button_{$i}"] = $bParam;
                    $i++;
                }
            }

            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->post($endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data']['whatsapp_response']['messages'][0]['id'] ?? $data['message_id'] ?? $data['id'] ?? 'success';
            }

            Log::error("WhatsMark sendTemplate failed. Status: {$response->status()}, Response: {$response->body()}");
            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark sendTemplate exception: {$e->getMessage()}", [
                'phone' => $phone,
                'template' => $template,
                'params' => $params,
                'headerParams' => $headerParams,
                'buttonParams' => $buttonParams
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

    /**
     * Get all statuses from WhatsMark.
     */
    public function getStatuses(): array
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark getStatuses failed: No instance_id provided.");
                return [];
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/statuses';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data']['data'] ?? $data['data'] ?? [];
            }

            Log::error("WhatsMark getStatuses failed. Status: {$response->status()}, Response: {$response->body()}");
            return [];
        } catch (\Throwable $e) {
            Log::error("WhatsMark getStatuses exception: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Create a status in WhatsMark.
     */
    public function createStatus(string $name, string $color = '#4f46e5'): ?int
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark createStatus failed: No instance_id provided.");
                return null;
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/statuses';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->post($endpoint, [
                'name' => $name,
                'color' => $color,
                'isdefault' => false,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data']['id'] ?? null;
            }

            Log::error("WhatsMark createStatus failed. Status: {$response->status()}, Response: {$response->body()}");
            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark createStatus exception: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get all sources from WhatsMark.
     */
    public function getSources(): array
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark getSources failed: No instance_id provided.");
                return [];
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/sources';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->get($endpoint);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data']['data'] ?? $data['data'] ?? [];
            }

            Log::error("WhatsMark getSources failed. Status: {$response->status()}, Response: {$response->body()}");
            return [];
        } catch (\Throwable $e) {
            Log::error("WhatsMark getSources exception: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Create a source in WhatsMark.
     */
    public function createSource(string $name): ?int
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark createSource failed: No instance_id provided.");
                return null;
            }

            $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/sources';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->post($endpoint, [
                'name' => $name,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['data']['id'] ?? null;
            }

            Log::error("WhatsMark createSource failed. Status: {$response->status()}, Response: {$response->body()}");
            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark createSource exception: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Find a contact by phone number in WhatsMark using API V2.
     */
    public function findContactByPhone(string $phone): ?array
    {
        try {
            $endpoint = rtrim($this->baseUrl, '/') . '/api/v2/contacts';
            
            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            $response = $request->get($endpoint, [
                'search' => $phone,
            ]);

            if ($response->successful()) {
                $data = $response->json()['data'] ?? [];
                
                // Do exact phone match comparison
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                foreach ($data as $contact) {
                    $cPhone = preg_replace('/[^0-9]/', '', $contact['phone'] ?? '');
                    if ($cPhone === $cleanPhone) {
                        return $contact;
                    }
                }
            }

            return null;
        } catch (\Throwable $e) {
            Log::error("WhatsMark findContactByPhone exception: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get or create a Status ID by its name.
     */
    public function getOrCreateStatusId(string $name): ?int
    {
        $statuses = $this->getStatuses();
        foreach ($statuses as $status) {
            if (strcasecmp($status['name'] ?? '', $name) === 0) {
                return (int)$status['id'];
            }
        }

        // Assign a nice color based on status name
        $color = '#4f46e5'; // Default indigo
        $lcName = strtolower($name);
        if (str_contains($lcName, 'caliente') || str_contains($lcName, 'hot')) {
            $color = '#ef4444'; // Red
        } elseif (str_contains($lcName, 'nuevo') || str_contains($lcName, 'new')) {
            $color = '#3b82f6'; // Blue
        } elseif (str_contains($lcName, 'perdido') || str_contains($lcName, 'lost')) {
            $color = '#9ca3af'; // Gray
        } elseif (str_contains($lcName, 'cliente') || str_contains($lcName, 'customer')) {
            $color = '#10b981'; // Green
        }

        return $this->createStatus($name, $color);
    }

    /**
     * Get or create a Source ID by its name.
     */
    public function getOrCreateSourceId(string $name): ?int
    {
        $sources = $this->getSources();
        foreach ($sources as $source) {
            if (strcasecmp($source['name'] ?? '', $name) === 0) {
                return (int)$source['id'];
            }
        }

        return $this->createSource($name);
    }

    /**
     * Sync contact information to WhatsMark.
     */
    public function syncContact(string $phone, array $data): bool
    {
        try {
            if (!$this->instanceId) {
                Log::error("WhatsMark syncContact failed: No instance_id provided.");
                return false;
            }

            // 1. Search if contact exists in WhatsMark
            $existingContact = $this->findContactByPhone($phone);
            
            // 2. Map Name to Firstname and Lastname
            $fullName = $data['name'] ?? 'Cliente';
            $nameParts = explode(' ', trim($fullName));
            $firstname = $nameParts[0];
            $lastname = implode(' ', array_slice($nameParts, 1)) ?: ' ';

            // 3. Resolve status_id
            $statusId = null;
            if (!empty($data['status_name'])) {
                $statusId = $this->getOrCreateStatusId($data['status_name']);
            }

            // 4. Resolve source_id
            $sourceId = null;
            if (!empty($data['source_name'])) {
                $sourceId = $this->getOrCreateSourceId($data['source_name']);
            }

            // 5. Determine contact type
            $type = $data['type'] ?? 'lead';
            if (!in_array($type, ['lead', 'customer', 'guest'])) {
                $type = 'lead';
            }

            // 6. Build groups comma-separated string
            $groupsString = '';
            if (!empty($data['groups'])) {
                $groupsString = is_array($data['groups']) ? implode(',', $data['groups']) : $data['groups'];
            }

            // 7. Prepare payload
            $payload = [
                'phone' => $phone,
                'firstname' => $firstname,
                'lastname' => $lastname,
                'email' => $data['email'] ?? null,
                'type' => $type,
                'status_id' => $statusId,
                'source_id' => $sourceId,
                'groups' => $groupsString,
                'company' => $data['company'] ?? null,
                'description' => $data['description'] ?? null,
            ];

            // Filter out null values to keep it clean
            $payload = array_filter($payload, function ($value) {
                return !is_null($value);
            });

            $request = Http::timeout(10);
            if ($this->apiKey) {
                $request = $request->withToken($this->apiKey);
            }

            if ($existingContact && isset($existingContact['id'])) {
                // Update existing contact
                $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/contacts/' . $existingContact['id'];
                Log::info("WhatsMark syncContact updating contact {$existingContact['id']} at {$endpoint}");
                $response = $request->put($endpoint, $payload);
            } else {
                // Create new contact
                $endpoint = rtrim($this->baseUrl, '/') . '/api/v1/' . $this->instanceId . '/contacts';
                Log::info("WhatsMark syncContact creating contact at {$endpoint}");
                $response = $request->post($endpoint, $payload);
            }

            if ($response->successful()) {
                Log::info("WhatsMark syncContact success for phone: {$phone}");
                return true;
            }

            Log::error("WhatsMark syncContact failed. Status: {$response->status()}, Response: {$response->body()}");
            return false;
        } catch (\Throwable $e) {
            Log::error("WhatsMark syncContact exception: {$e->getMessage()}", [
                'phone' => $phone,
                'data' => $data
            ]);
            return false;
        }
    }
}

