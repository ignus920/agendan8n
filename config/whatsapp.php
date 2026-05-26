<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WhatsApp API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración para el servicio de WhatsApp utilizado para envío de
    | códigos de verificación y notificaciones.
    |
    */

    'api_url' => env('WHATSAPP_API_URL', 'http://api.sersia.co:3010/api/dosil_code'),

    'jwt_secret' => env('WHATSAPP_JWT_SECRET', 'dosil_by_ticsia'),

    'empresa_email' => env('WHATSAPP_EMPRESA_EMAIL', 'clozano@ticsia.com'),

    'default_template' => env('WHATSAPP_DEFAULT_TEMPLATE', 'dosil_code1'),

    'default_image' => env('WHATSAPP_DEFAULT_IMAGE', 'https://dosil.co/files/img/logop.png'),

    /*
    |--------------------------------------------------------------------------
    | Configuración de la empresa por defecto
    |--------------------------------------------------------------------------
    */

    'empresa' => [
        'telefono' => env('WHATSAPP_EMPRESA_TELEFONO', '+573001234567'),
        'nombre' => env('WHATSAPP_EMPRESA_NOMBRE', 'Tu Empresa'),
        'codigo_pais' => env('WHATSAPP_CODIGO_PAIS', '+57'), // Colombia por defecto
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuración de timeouts y reintentos
    |--------------------------------------------------------------------------
    */

    'timeout' => env('WHATSAPP_TIMEOUT', 30), // segundos

    'max_retries' => env('WHATSAPP_MAX_RETRIES', 3),

    /*
    |--------------------------------------------------------------------------
    | Configuración de logging
    |--------------------------------------------------------------------------
    */

    'log_requests' => env('WHATSAPP_LOG_REQUESTS', true),

    'log_responses' => env('WHATSAPP_LOG_RESPONSES', true),
];