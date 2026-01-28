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
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('scheduled_post_id')->nullable()->after('social_account_id');
            $table->string('post_type')->nullable()->after('platform_post_id');
            $table->string('post_url')->nullable()->after('post_type');
            $table->string('thumbnail_url')->nullable()->after('media_urls');
            $table->timestamp('published_at')->nullable()->after('thumbnail_url');
            $table->integer('retry_count')->default(0)->after('status');
            $table->timestamp('last_retry_at')->nullable()->after('retry_count');
            $table->json('engagement_data')->nullable()->after('last_retry_at');
            $table->json('post_metadata')->nullable()->after('engagement_data');

            // Ideally add FK if scheduled_posts table exists and is reliable
            // $table->foreign('scheduled_post_id')->references('id')->on('scheduled_posts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropColumn([
                'scheduled_post_id',
                'post_type',
                'post_url',
                'thumbnail_url',
                'published_at',
                'retry_count',
                'last_retry_at',
                'engagement_data',
                'post_metadata'
            ]);
        });
    }
};
