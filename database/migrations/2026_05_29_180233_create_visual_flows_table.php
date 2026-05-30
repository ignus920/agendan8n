<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('visual_flows', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('flow_data')->nullable(); // Store nodes and edges for React Flow
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visual_flows');
    }
};
