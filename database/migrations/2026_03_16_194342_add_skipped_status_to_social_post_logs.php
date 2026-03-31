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
        Schema::table('social_post_logs', function (Blueprint $table) {
            // No need to add column, just update the enum constraint
            // The status column already exists, we just need to ensure 'skipped' is a valid value
        });
        
        // Update the check constraint to include 'skipped' status
        DB::statement("ALTER TABLE social_post_logs DROP CONSTRAINT IF EXISTS social_post_logs_status_check");
        DB::statement("ALTER TABLE social_post_logs ADD CONSTRAINT social_post_logs_status_check CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'removed_on_platform', 'deleted', 'skipped'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            // Revert to original constraint without 'skipped'
        });
        
        DB::statement("ALTER TABLE social_post_logs DROP CONSTRAINT IF EXISTS social_post_logs_status_check");
        DB::statement("ALTER TABLE social_post_logs ADD CONSTRAINT social_post_logs_status_check CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'removed_on_platform', 'deleted'))");
    }
};
