<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // sync, import, export, webhook, etc.
            $table->string('status'); // success, error, pending
            $table->json('data')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at');

            $table->index(['integration_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_logs');
    }
};
