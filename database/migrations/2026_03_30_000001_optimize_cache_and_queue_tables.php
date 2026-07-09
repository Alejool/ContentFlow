<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // VACUUM cannot run inside a transaction, so transactions are disabled only on
    // PostgreSQL (where VACUUM runs). On other drivers (e.g. SQLite used in tests)
    // keeping the default transactional behavior avoids desyncing the connection's
    // transaction state, which otherwise breaks RefreshDatabase across tests.
    public $withinTransaction = true;

    public function __construct()
    {
        $this->withinTransaction = config('database.default') !== 'pgsql';
    }

    public function up(): void
    {
        // VACUUM ANALYZE <table> is PostgreSQL-only syntax
        $isPgsql = config('database.default') === 'pgsql';

        // Optimizar tabla cache
        if (Schema::hasTable('cache')) {
            DB::statement('CREATE INDEX IF NOT EXISTS cache_expiration_idx ON cache (expiration)');
            if ($isPgsql) {
                DB::statement('VACUUM ANALYZE cache');
            }
        }

        // Optimizar tabla jobs
        if (Schema::hasTable('jobs')) {
            DB::statement('CREATE INDEX IF NOT EXISTS jobs_queue_reserved_at_idx ON jobs (queue, reserved_at)');
            DB::statement('CREATE INDEX IF NOT EXISTS jobs_available_at_idx ON jobs (available_at)');
            if ($isPgsql) {
                DB::statement('VACUUM ANALYZE jobs');
            }
        }

        // Optimizar tabla sessions (si existe)
        if (Schema::hasTable('sessions')) {
            DB::statement('CREATE INDEX IF NOT EXISTS sessions_last_activity_idx ON sessions (last_activity)');
            if ($isPgsql) {
                DB::statement('VACUUM ANALYZE sessions');
            }
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
