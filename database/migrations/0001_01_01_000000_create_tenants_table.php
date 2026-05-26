<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('slug', 100)->unique();
            $table->text('logo_url')->nullable();
            $table->string('whatsapp_number', 20)->nullable();
            $table->text('whatsmark_api_key')->nullable();
            $table->string('whatsmark_instance_id', 100)->nullable();
            $table->text('n8n_webhook_url')->nullable();
            $table->string('ai_provider', 50)->default('openrouter');
            $table->text('ai_api_token')->nullable();
            $table->string('ai_model', 100)->default('google/gemini-2.0-flash');
            $table->string('timezone', 50)->default('America/Bogota');
            $table->json('settings')->default('{}');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
