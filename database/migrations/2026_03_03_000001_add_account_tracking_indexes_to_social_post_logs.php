<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('social_post_logs', function (Blueprint $table) {
      // Add composite index for faster queries when checking publication status per account
      $table->index(['publication_id', 'social_account_id', 'status'], 'idx_pub_account_status');
      
      // Add index for platform queries
      $table->index(['publication_id', 'platform', 'status'], 'idx_pub_platform_status');
    });
  }

  public function down(): void
  {
    Schema::table('social_post_logs', function (Blueprint $table) {
      $table->dropIndex('idx_pub_account_status');
      $table->dropIndex('idx_pub_platform_status');
    });
  }
};
