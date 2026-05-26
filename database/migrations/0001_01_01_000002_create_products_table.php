<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->integer('repurchase_frequency_days')->nullable();
            $table->json('tags')->default('[]');
            $table->json('images')->default('[]');
            $table->boolean('is_featured')->default(false);
            $table->string('status', 20)->default('active');
            $table->integer('sort_order')->default(0);
            $table->json('metadata')->default('{}');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
