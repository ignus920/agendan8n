<?php

require 'vendor/autoload.php';

$baseUrl = 'https://chat.dosil.com.co';

$endpoints = [
    '/api/v1/test/templates/send',
    '/api/v1/test/messages/send',
    '/api/send',
    '/api/v1/send',
];

foreach ($endpoints as $endpoint) {
    try {
        $response = Http::post($baseUrl . $endpoint);
        echo $endpoint . ' -> ' . $response->status() . "\n";
    } catch (\Exception $e) {
        echo $endpoint . ' -> ' . $e->getMessage() . "\n";
    }
}
