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
      $table->bigInteger('current_usage')->change();
      $table->bigInteger('limit')->change();
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('usage_metrics', function (Blueprint $table) {
      $table->integer('current_usage')->change();
      $table->integer('limit')->change();
    });
  }
};
