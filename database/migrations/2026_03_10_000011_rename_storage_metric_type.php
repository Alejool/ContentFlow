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
    // Update metric_type from 'storage' to 'storage_bytes'
    DB::table('usage_metrics')
      ->where('metric_type', 'storage')
      ->update([
        'metric_type' => 'storage_bytes',
        // Assuming previous values were stored in GB, convert back to bytes
        // DB::raw() is used to multiply the current GB value (which might be a float/int) by 1024^3
        'current_usage' => DB::raw('current_usage * 1024 * 1024 * 1024')
      ]);
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    DB::table('usage_metrics')
      ->where('metric_type', 'storage_bytes')
      ->update([
        'metric_type' => 'storage',
        // Convert bytes back to GB
        'current_usage' => DB::raw('current_usage / (1024 * 1024 * 1024)')
      ]);
  }
};
