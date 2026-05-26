<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\ContactScoreController;
use App\Http\Controllers\Api\ChatbotApiController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('v1')->group(function () {
    Route::post('/webhook/events', [WebhookController::class, 'handleEvent']);
    Route::post('/contacts/update-score', [ContactScoreController::class, 'updateScore']);
    
    // Resolve session globally by phone
    Route::post('/chatbot/resolve-session', [ChatbotApiController::class, 'resolveSession']);

    // Chatbot endpoints scoped by tenant
    Route::middleware('tenant')->group(function () {
        Route::get('/chatbot/products', [ChatbotApiController::class, 'products']);
        Route::get('/chatbot/resources', [ChatbotApiController::class, 'resources']);
        Route::get('/chatbot/resources/{resource}/availability', [ChatbotApiController::class, 'availability']);
        Route::post('/chatbot/bookings', [ChatbotApiController::class, 'book']);
        Route::post('/chatbot/send-message', [ChatbotApiController::class, 'sendMessage']);
        Route::post('/chatbot/save-session', [ChatbotApiController::class, 'saveSession']);
    });
});

