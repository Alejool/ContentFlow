<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            $table->unsignedBigInteger('user_calendar_event_id')->nullable()->after('publication_id');
            $table->foreign('user_calendar_event_id')->references('id')->on('user_calendar_events')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('external_calendar_events', function (Blueprint $table) {
            $table->dropForeign(['user_calendar_event_id']);
            $table->dropColumn('user_calendar_event_id');
        });
    }
};
