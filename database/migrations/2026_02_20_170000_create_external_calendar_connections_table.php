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
        Schema::create('external_calendar_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->enum('provider', ['google', 'outlook']);
            $table->string('email');
            $table->text('access_token');
            $table->text('refresh_token');
            $table->timestamp('token_expires_at')->nullable();
            $table->boolean('sync_enabled')->default(true);
            $table->json('sync_config')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->enum('status', ['connected', 'error'])->default('connected');
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'workspace_id', 'provider'], 'unique_user_provider');
            $table->index(['user_id', 'workspace_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_calendar_connections');
    }
};
