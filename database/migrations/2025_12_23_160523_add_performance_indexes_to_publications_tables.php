<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   *
   * These indexes optimize the N+1 query problem in PublicationController
   * by improving JOIN performance and WHERE clause filtering.
   */
  public function up(): void
  {
    $this->addIndexIfMissing('publications', ['user_id', 'created_at'], 'idx_user_created');
    $this->addIndexIfMissing('publications', 'status', 'idx_status');

    // Correct column name is file_type
    if (Schema::hasColumn('media_files', 'file_type')) {
      $this->addIndexIfMissing('media_files', 'file_type', 'idx_type');
    }

    $this->addIndexIfMissing('publication_media', ['publication_id', 'order'], 'idx_publication_order');
    $this->addIndexIfMissing('scheduled_posts', ['publication_id', 'status'], 'idx_scheduled_posts_pub_status');
    $this->addIndexIfMissing('scheduled_posts', 'social_account_id', 'idx_scheduled_posts_account');
    $this->addIndexIfMissing('social_post_logs', ['publication_id', 'status'], 'idx_social_post_logs_pub_status');
    $this->addIndexIfMissing('social_post_logs', 'social_account_id', 'idx_social_post_logs_account');
    $this->addIndexIfMissing('campaign_publication', 'publication_id', 'idx_publication');
  }

  private function addIndexIfMissing(string $table, $columns, string $indexName): void
  {
    if (!Schema::hasIndex($table, $indexName)) {
      Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
        $table->index($columns, $indexName);
      });
    }
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('publications', function (Blueprint $table) {
      $table->dropIndex('idx_user_created');
      $table->dropIndex('idx_status');
    });

    Schema::table('media_files', function (Blueprint $table) {
      $table->dropIndex('idx_type');
    });

    Schema::table('publication_media', function (Blueprint $table) {
      $table->dropIndex('idx_publication_order');
    });

    Schema::table('scheduled_posts', function (Blueprint $table) {
      $table->dropIndex('idx_scheduled_posts_pub_status');
      $table->dropIndex('idx_scheduled_posts_account');
    });

    Schema::table('social_post_logs', function (Blueprint $table) {
      $table->dropIndex('idx_social_post_logs_pub_status');
      $table->dropIndex('idx_social_post_logs_account');
    });

    Schema::table('campaign_publication', function (Blueprint $table) {
      $table->dropIndex('idx_publication');
    });
  }
};
