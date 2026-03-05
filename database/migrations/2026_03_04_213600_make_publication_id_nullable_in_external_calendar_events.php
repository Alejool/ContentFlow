<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            // Make publication_id nullable since we now support user_calendar_event_id as well
            $table->unsignedBigInteger('publication_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            // Note: This will fail if there are records with null publication_id
            $table->unsignedBigInteger('publication_id')->nullable(false)->change();
        });
    }
};
