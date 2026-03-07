<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('usage_metrics', function (Blueprint $table) {
      $table->string('plan_id')->nullable()->after('workspace_id')->comment('Plan identifier attached at the moment of metric creation for monthly traceability (e.g. starter, professional)');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('usage_metrics', function (Blueprint $table) {
      $table->dropColumn('plan_id');
    });
  }
};
