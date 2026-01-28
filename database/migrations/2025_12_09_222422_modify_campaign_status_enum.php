<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            // For PostgreSQL, we can't easily alter ENUM types in a single statement like MySQL.
            // A common workaround is to drop the check constraint (if strictly checking) or just
            // treat it as string modification if the driver supports it.
            // Ideally, we just update the allowed values if using native enums, but Laravel often treats enums as strings with checks.

            // Simplest cross-database approach for this specific migration:
            // Since we are widening the enum (adding 'published'), we can just re-define the column.

            $table->string('status')->default('draft')->change();
            // Note: In a real production data migration from MySQL to PG, data types might need explicit casting.
            // But here we are likely just fixing the definition for a fresh install or forward migration.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->string('status')->default('draft')->change();
        });
    }
};
