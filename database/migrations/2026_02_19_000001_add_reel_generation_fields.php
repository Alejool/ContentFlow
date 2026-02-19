<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      $table->json('ai_analysis')->nullable()->after('metadata');
      $table->boolean('auto_generate_reels')->default(false)->after('ai_analysis');
    });

    Schema::table('publications', function (Blueprint $table) {
      $table->boolean('auto_optimize_reels')->default(false)->after('platform_settings');
    });
  }

  public function down(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      $table->dropColumn(['ai_analysis', 'auto_generate_reels']);
    });

    Schema::table('publications', function (Blueprint $table) {
      $table->dropColumn('auto_optimize_reels');
    });
  }
};
