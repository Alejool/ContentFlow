<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Optimizar tabla cache
        if (Schema::hasTable('cache')) {
            DB::statement('CREATE INDEX IF NOT EXISTS cache_expiration_idx ON cache (expiration)');
            DB::statement('VACUUM ANALYZE cache');
        }

        // Optimizar tabla jobs
        if (Schema::hasTable('jobs')) {
            DB::statement('CREATE INDEX IF NOT EXISTS jobs_queue_reserved_at_idx ON jobs (queue, reserved_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS jobs_available_at_idx ON jobs (available_at)');
            DB::statement('VACUUM ANALYZE jobs');
        }

        // Optimizar tabla sessions (si existe)
        if (Schema::hasTable('sessions')) {
            DB::statement('CREATE INDEX IF NOT EXISTS sessions_last_activity_idx ON sessions (last_activity)');
            DB::statement('VACUUM ANALYZE sessions');
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cache_expiration_idx');
        DB::statement('DROP INDEX IF EXISTS jobs_queue_reserved_at_idx');
        DB::statement('DROP INDEX IF EXISTS jobs_available_at_idx');
        DB::statement('DROP INDEX IF EXISTS sessions_last_activity_idx');
    }
};
