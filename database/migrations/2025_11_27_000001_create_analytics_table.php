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
        Schema::create('analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('metric_type'); // campaign, social_media, post, engagement
            $table->string('metric_name'); // views, clicks, conversions, followers, etc.
            $table->decimal('metric_value', 15, 2);
            $table->date('metric_date');
            $table->string('platform')->nullable(); // facebook, instagram, twitter, tiktok, youtube
            $table->unsignedBigInteger('reference_id')->nullable(); // campaign_id, post_id, etc.
            $table->string('reference_type')->nullable(); // Campaign, Post, etc.
            $table->json('metadata')->nullable(); // Additional data
            $table->timestamps();

            // Indexes for better query performance
            $table->index(['user_id', 'metric_date']);
            $table->index(['metric_type', 'metric_name']);
            $table->index(['platform', 'metric_date']);
            $table->index(['reference_id', 'reference_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analytics');
    }
};
