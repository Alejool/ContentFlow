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
    Schema::table('scheduled_posts', function (Blueprint $table) {
      $table->string('account_name')->nullable()->after('social_account_id');
      $table->string('platform')->nullable()->after('account_name');
    });

    Schema::table('social_post_logs', function (Blueprint $table) {
      $table->string('account_name')->nullable()->after('social_account_id');
      // 'platform' already exists in social_post_logs
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('scheduled_posts', function (Blueprint $table) {
      $table->dropColumn(['account_name', 'platform']);
    });

    Schema::table('social_post_logs', function (Blueprint $table) {
      $table->dropColumn(['account_name']);
    });
  }
};
