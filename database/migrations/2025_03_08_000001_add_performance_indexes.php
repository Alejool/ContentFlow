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
        // Add indexes for media_files queries
        if (Schema::hasTable('media_files')) {
            Schema::table('media_files', function (Blueprint $table) {
                $table->index(['workspace_id', 'file_type', 'status'], 'idx_media_workspace_type_status');
                $table->index(['user_id', 'created_at'], 'idx_media_user_created');
                $table->index('status', 'idx_media_status');
            });
        }

        // Add indexes for media_derivatives queries
        if (Schema::hasTable('media_derivatives')) {
            Schema::table('media_derivatives', function (Blueprint $table) {
                // Composite index for common queries
                $table->index(['media_file_id', 'derivative_type', 'platform'], 'idx_derivatives_lookup');
            });
        }

        // Add indexes for publications queries
        if (Schema::hasTable('publications')) {
            Schema::table('publications', function (Blueprint $table) {
                $table->index(['workspace_id', 'status', 'created_at'], 'idx_publications_workspace_status');
                $table->index(['user_id', 'status'], 'idx_publications_user_status');
                $table->index('scheduled_at', 'idx_publications_scheduled');
            });
        }

        // Add indexes for publication_media queries
        if (Schema::hasTable('publication_media')) {
            Schema::table('publication_media', function (Blueprint $table) {
                $table->index(['publication_id', 'order'], 'idx_pub_media_order');
            });
        }

        // Add indexes for social_post_logs queries
        if (Schema::hasTable('social_post_logs')) {
            Schema::table('social_post_logs', function (Blueprint $table) {
                if (!Schema::hasIndex('social_post_logs', 'idx_social_logs_pub_status')) {
                    $table->index(['publication_id', 'status'], 'idx_social_logs_pub_status');
                }
                if (!Schema::hasIndex('social_post_logs', 'idx_social_logs_platform')) {
                    $table->index(['platform', 'published_at'], 'idx_social_logs_platform');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->dropIndex('idx_media_workspace_type_status');
            $table->dropIndex('idx_media_user_created');
            $table->dropIndex('idx_media_status');
        });

        Schema::table('media_derivatives', function (Blueprint $table) {
            $table->dropIndex('idx_derivatives_lookup');
        });

        Schema::table('publications', function (Blueprint $table) {
            $table->dropIndex('idx_publications_workspace_status');
            $table->dropIndex('idx_publications_user_status');
            $table->dropIndex('idx_publications_scheduled');
        });

        Schema::table('publication_media', function (Blueprint $table) {
            $table->dropIndex('idx_pub_media_order');
        });

        if (Schema::hasTable('social_post_logs')) {
            Schema::table('social_post_logs', function (Blueprint $table) {
                if (Schema::hasIndex('social_post_logs', 'idx_social_logs_pub_status')) {
                    $table->dropIndex('idx_social_logs_pub_status');
                }
                if (Schema::hasIndex('social_post_logs', 'idx_social_logs_platform')) {
                    $table->dropIndex('idx_social_logs_platform');
                }
            });
        }
    }
};
