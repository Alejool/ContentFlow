<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campaign analytics table (for publication analytics)
        Schema::create('campaign_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained('publications')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('platform')->nullable();
            $table->date('date');
            $table->integer('views')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('conversions')->default(0);
            $table->integer('reach')->default(0);
            $table->integer('impressions')->default(0);
            $table->integer('likes')->default(0);
            $table->integer('comments')->default(0);
            $table->integer('shares')->default(0);
            $table->integer('saves')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            $table->decimal('ctr', 5, 2)->default(0);
            $table->decimal('conversion_rate', 5, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['publication_id', 'date']);
            $table->index(['user_id', 'date']);
        });

        // Analytics table (general analytics)
        Schema::create('analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('metric_type'); // 'daily', 'weekly', 'monthly'
            $table->date('date');
            $table->integer('total_publications')->default(0);
            $table->integer('total_posts')->default(0);
            $table->integer('total_views')->default(0);
            $table->integer('total_clicks')->default(0);
            $table->integer('total_engagement')->default(0);
            $table->decimal('avg_engagement_rate', 5, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'date']);
        });

        // Social media metrics table
        Schema::create('social_media_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->integer('followers')->default(0);
            $table->integer('following')->default(0);
            $table->integer('posts_count')->default(0);
            $table->integer('total_likes')->default(0);
            $table->integer('total_comments')->default(0);
            $table->integer('total_shares')->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['social_account_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_media_metrics');
        Schema::dropIfExists('analytics');
        Schema::dropIfExists('campaign_analytics');
    }
};
