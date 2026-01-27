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
    if (config('database.default') === 'pgsql') {
      DB::statement('ALTER TABLE social_post_logs DROP CONSTRAINT IF EXISTS social_post_logs_status_check');
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    // No easy way to restore the exact constraint without knowing the old enum values
  }
};
