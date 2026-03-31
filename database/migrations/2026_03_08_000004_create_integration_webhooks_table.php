<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('provider'); // zapier, shopify, hubspot, etc.
            $table->string('event_type');
            $table->json('payload');
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at');

            $table->index(['integration_id', 'processed_at']);
            $table->index(['provider', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_webhooks');
    }
};
