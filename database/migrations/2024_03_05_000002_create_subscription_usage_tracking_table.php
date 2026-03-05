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
        Schema::create('subscription_usage_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_history_id')->constrained('subscription_history')->onDelete('cascade');
            
            // Period tracking
            $table->integer('year');
            $table->integer('month');
            $table->date('period_start');
            $table->date('period_end');
            
            // Usage metrics
            $table->integer('publications_used')->default(0);
            $table->integer('publications_limit');
            $table->integer('social_accounts_used')->default(0);
            $table->integer('social_accounts_limit');
            $table->bigInteger('storage_used_bytes')->default(0); // in bytes
            $table->bigInteger('storage_limit_bytes');
            $table->integer('ai_requests_used')->default(0);
            $table->integer('ai_requests_limit')->nullable();
            
            // Additional metrics
            $table->integer('reels_generated')->default(0);
            $table->integer('scheduled_posts')->default(0);
            $table->integer('analytics_views')->default(0);
            
            // Status
            $table->boolean('limit_reached')->default(false);
            $table->timestamp('limit_reached_at')->nullable();
            
            // Metadata
            $table->json('daily_breakdown')->nullable(); // Daily usage breakdown
            
            $table->timestamps();
            
            $table->unique(['user_id', 'subscription_history_id', 'year', 'month'], 'usage_tracking_unique');
            $table->index(['user_id', 'year', 'month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_usage_tracking');
    }
};
