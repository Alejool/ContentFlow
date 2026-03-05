<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            // Drop the old unique constraint
            $table->dropUnique('unique_publication_provider');
            
            // Add separate unique constraints for publications and user events
            // For publications: connection_id + publication_id must be unique
            $table->unique(['connection_id', 'publication_id'], 'unique_connection_publication');
            
            // For user events: connection_id + user_calendar_event_id must be unique
            $table->unique(['connection_id', 'user_calendar_event_id'], 'unique_connection_user_event');
        });
    }

    public function down(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            // Drop the new constraints
            $table->dropUnique('unique_connection_publication');
            $table->dropUnique('unique_connection_user_event');
            
            // Restore the old constraint (this will fail if there are user events)
            $table->unique(['publication_id', 'provider', 'connection_id'], 'unique_publication_provider');
        });
    }
};
