<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('whatsapp_phone', 20);
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->integer('lead_score')->default(0);
            $table->string('funnel_stage', 50)->default('new');
            $table->string('interest_level', 20)->default('unknown');
            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->json('tags')->default('[]');
            $table->unsignedBigInteger('last_product_id')->nullable();
            $table->timestamp('last_purchase_at')->nullable();
            $table->timestamp('next_repurchase_at')->nullable();
            $table->boolean('bot_paused')->default(false);
            $table->timestamp('bot_paused_until')->nullable();
            $table->json('metadata')->default('{}');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('assigned_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('last_product_id')->references('id')->on('products')->nullOnDelete();

            $table->unique(['tenant_id', 'whatsapp_phone']);
            $table->index('tenant_id');
            $table->index(['tenant_id', 'next_repurchase_at']);
            $table->index(['tenant_id', 'funnel_stage']);
            $table->index(['tenant_id', 'lead_score']);
        });

        Schema::create('contact_memory', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contact_id');
            $table->uuid('tenant_id');
            $table->string('key', 100);
            $table->text('value')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->unique(['contact_id', 'key']);
        });

        Schema::create('contact_interactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contact_id');
            $table->uuid('tenant_id');
            $table->string('type', 50);
            $table->string('direction', 10)->nullable();
            $table->text('content')->nullable();
            $table->json('metadata')->default('{}');
            $table->timestamp('created_at')->nullable();

            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['contact_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_interactions');
        Schema::dropIfExists('contact_memory');
        Schema::dropIfExists('contacts');
    }
};
