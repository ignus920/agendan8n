<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configurable automation rules
        Schema::create('automations', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('name');
            $table->string('event_type', 100);
            $table->json('conditions')->default('{}');
            $table->json('actions'); // [{type, params}]
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(0);
            $table->integer('cooldown_hours')->default(0);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'event_type', 'is_active']);
        });

        // Automation execution logs
        Schema::create('automation_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('automation_id')->nullable();
            $table->uuid('tenant_id');
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->string('event_type', 100);
            $table->json('event_payload')->nullable();
            $table->json('actions_executed')->nullable();
            $table->string('status', 20)->default('success');
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at')->useCurrent();

            $table->foreign('automation_id')->references('id')->on('automations')->nullOnDelete();
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('contact_id')->references('id')->on('contacts')->nullOnDelete();
            $table->index(['tenant_id', 'executed_at']);
        });

        // Lead scoring rules
        Schema::create('lead_scoring_rules', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('name')->nullable();
            $table->string('event_type', 100);
            $table->json('condition')->default('{}');
            $table->integer('score_delta');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'event_type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_scoring_rules');
        Schema::dropIfExists('automation_logs');
        Schema::dropIfExists('automations');
    }
};
