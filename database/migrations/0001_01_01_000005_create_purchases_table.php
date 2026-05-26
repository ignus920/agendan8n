<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->unsignedBigInteger('contact_id');
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('booking_id')->nullable();
            $table->decimal('amount', 12, 2)->nullable();
            $table->timestamp('purchased_at')->useCurrent();
            $table->timestamp('next_repurchase_at')->nullable();
            $table->string('repurchase_status', 30)->default('pending');
            $table->json('metadata')->default('{}');
            $table->timestamp('created_at')->nullable();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('contact_id')->references('id')->on('contacts')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->nullOnDelete();
            $table->foreign('booking_id')->references('id')->on('bookings')->nullOnDelete();

            $table->index(['tenant_id', 'next_repurchase_at', 'repurchase_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
