<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the check constraint to include 'orphaned' status
        DB::statement("ALTER TABLE social_post_logs DROP CONSTRAINT IF EXISTS social_post_logs_status_check");
        DB::statement("ALTER TABLE social_post_logs ADD CONSTRAINT social_post_logs_status_check CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'removed_on_platform', 'deleted', 'skipped', 'orphaned'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to constraint without 'orphaned'
        DB::statement("ALTER TABLE social_post_logs DROP CONSTRAINT IF EXISTS social_post_logs_status_check");
        DB::statement("ALTER TABLE social_post_logs ADD CONSTRAINT social_post_logs_status_check CHECK (status IN ('pending', 'publishing', 'published', 'failed', 'removed_on_platform', 'deleted', 'skipped'))");
    }
};
