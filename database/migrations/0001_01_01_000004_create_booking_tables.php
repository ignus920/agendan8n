<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bookable resources (people, rooms, equipment, vehicles, etc.)
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('name');
            $table->string('type', 50); // person, room, equipment, vehicle
            $table->text('description')->nullable();
            $table->integer('capacity')->default(1);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->default('{}');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index('tenant_id');
        });

        // Weekly availability schedule per resource
        Schema::create('resource_schedules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('resource_id');
            $table->uuid('tenant_id');
            $table->smallInteger('day_of_week'); // 0=sunday, 6=saturday
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);

            $table->foreign('resource_id')->references('id')->on('resources')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // Schedule exceptions (holidays, blocks, special hours)
        Schema::create('schedule_exceptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->uuid('tenant_id');
            $table->date('exception_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->boolean('is_available')->default(false);
            $table->string('reason')->nullable();

            $table->foreign('resource_id')->references('id')->on('resources')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });

        // Bookings (business-agnostic: appointments, reservations, tours, visits, etc.)
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->unsignedBigInteger('contact_id')->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('assigned_user_id')->nullable();
            $table->string('title')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('status', 30)->default('pending');
            $table->text('notes')->nullable();
            $table->string('source', 30)->default('whatsapp');
            $table->json('metadata')->default('{}');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('contact_id')->references('id')->on('contacts')->nullOnDelete();
            $table->foreign('resource_id')->references('id')->on('resources')->nullOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            $table->foreign('assigned_user_id')->references('id')->on('users')->nullOnDelete();

            $table->index(['tenant_id', 'starts_at']);
            $table->index(['resource_id', 'starts_at']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('schedule_exceptions');
        Schema::dropIfExists('resource_schedules');
        Schema::dropIfExists('resources');
    }
};
