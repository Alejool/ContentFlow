<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('webhook_logs', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $blueprint->string('channel'); // slack, discord
            $blueprint->string('event_type'); // publication_failed, approval_requested, etc.
            $blueprint->text('payload');
            $blueprint->text('response')->nullable();
            $blueprint->integer('status_code')->nullable();
            $blueprint->boolean('success');
            $blueprint->string('error_message')->nullable();
            $blueprint->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhook_logs');
    }
};
