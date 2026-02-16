<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_status_check");
        DB::statement("ALTER TABLE scheduled_posts ADD CONSTRAINT scheduled_posts_status_check CHECK (status IN ('pending', 'posted', 'published', 'failed'))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE scheduled_posts DROP CONSTRAINT IF EXISTS scheduled_posts_status_check");
        DB::statement("ALTER TABLE scheduled_posts ADD CONSTRAINT scheduled_posts_status_check CHECK (status IN ('pending', 'published', 'failed'))");
    }
};
