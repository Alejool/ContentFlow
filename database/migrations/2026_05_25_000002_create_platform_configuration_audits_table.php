<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FASE 7: Database - Auditoría de cambios de configuración
 * 
 * Registra todos los cambios en las configuraciones de plataformas
 * para auditoría y rollback.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_configuration_audits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->nullable();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            
            $table->string('action'); // created, updated, deleted, restored
            $table->string('platform_key');
            $table->string('config_key');
            
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            
            $table->string('reason')->nullable();
            $table->text('notes')->nullable();
            $table->string('ip_address')->nullable();
            
            $table->timestamps();
            
            $table->index(['workspace_id', 'platform_key', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_configuration_audits');
    }
};
