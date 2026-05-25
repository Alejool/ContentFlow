<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FASE 7: Database - Reglas de capacidades personalizadas
 * 
 * Permite override de capacidades por usuario, plan o workspace.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_capability_overrides', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->nullable();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            
            $table->string('plan')->nullable(); // free, pro, business, admin
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            
            $table->string('platform_key');
            $table->string('capability_key');
            $table->string('value_type'); // bool, int, string, json
            $table->text('value');
            
            $table->boolean('is_active')->default(true);
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_until')->nullable();
            
            $table->text('reason')->nullable();
            $table->timestamps();
            
            $table->index(['workspace_id', 'platform_key']);
            $table->index(['user_id', 'platform_key']);
            $table->index(['plan', 'platform_key']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_capability_overrides');
    }
};
