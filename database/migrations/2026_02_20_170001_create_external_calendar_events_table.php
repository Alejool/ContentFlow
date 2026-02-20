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
        Schema::create('external_calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connection_id')->constrained('external_calendar_connections')->onDelete('cascade');
            $table->foreignId('publication_id')->constrained('publications')->onDelete('cascade');
            $table->string('external_event_id');
            $table->enum('provider', ['google', 'outlook']);
            $table->timestamp('synced_at')->useCurrent();
            $table->timestamp('last_updated_at')->useCurrent()->useCurrentOnUpdate();
            
            $table->unique(['publication_id', 'provider', 'connection_id'], 'unique_publication_provider');
            $table->index(['connection_id', 'publication_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('external_calendar_events');
    }
};
