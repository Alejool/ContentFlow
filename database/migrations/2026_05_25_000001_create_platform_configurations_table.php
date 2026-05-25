<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * FASE 7: Database - Crear tabla de configuraciones de plataforma
 * 
 * Almacena configuraciones personalizadas por workspace/cliente.
 * Permite overrides sin tocar los archivos de config.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_configurations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('workspace_id')->nullable();
            $table->foreign('workspace_id')->references('id')->on('workspaces')->onDelete('cascade');
            
            $table->string('platform_key')->index();
            $table->string('config_key');
            $table->json('value');
            
            $table->boolean('is_active')->default(true);
            $table->string('version')->default('1.0');
            $table->text('description')->nullable();
            
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_until')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['workspace_id', 'platform_key', 'config_key']);
            $table->index(['platform_key', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_configurations');
    }
};
