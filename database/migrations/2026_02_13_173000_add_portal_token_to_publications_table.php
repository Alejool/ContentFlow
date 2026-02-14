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
    Schema::table('publications', function (Blueprint $blueprint) {
      $blueprint->string('portal_token', 64)->nullable()->unique()->after('status');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('publications', function (Blueprint $blueprint) {
      $blueprint->dropColumn('portal_token');
    });
  }
};
