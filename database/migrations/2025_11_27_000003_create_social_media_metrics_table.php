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
        Schema::create('social_media_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
            $table->date('date');
            
            // Account metrics
            $table->integer('followers')->default(0);
            $table->integer('following')->default(0);
            $table->integer('posts_count')->default(0);
            
            // Engagement metrics
            $table->integer('total_likes')->default(0);
            $table->integer('total_comments')->default(0);
            $table->integer('total_shares')->default(0);
            $table->integer('total_saves')->default(0);
            
            // Reach metrics
            $table->integer('reach')->default(0);
            $table->integer('impressions')->default(0);
            $table->integer('profile_views')->default(0);
            
            // Growth metrics
            $table->integer('followers_gained')->default(0);
            $table->integer('followers_lost')->default(0);
            $table->decimal('growth_rate', 5, 2)->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            
            // Platform-specific metrics (JSON for flexibility)
            $table->json('platform_data')->nullable();
            
            $table->timestamps();

            // Indexes
            $table->unique(['social_account_id', 'date']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_media_metrics');
    }
};
