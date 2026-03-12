<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            // Add content_type field
            $table->enum('content_type', [
                'post',      // Standard post
                'reel',      // Short video (Instagram Reels, TikTok, YouTube Shorts)
                'story',     // Temporary content (Instagram/Facebook Stories)
                'poll',      // Poll/Survey
                'carousel',  // Multiple images
            ])->default('post')->after('status');
            
            // Add poll-specific fields
            $table->json('poll_options')->nullable()->after('content_type');
            $table->integer('poll_duration_hours')->nullable()->after('poll_options');
            
            // Add carousel-specific fields
            $table->json('carousel_items')->nullable()->after('poll_duration_hours');
            
            // Add content metadata
            $table->json('content_metadata')->nullable()->after('carousel_items');
        });
    }

    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            $table->dropColumn([
                'content_type',
                'poll_options',
                'poll_duration_hours',
                'carousel_items',
                'content_metadata',
            ]);
        });
    }
};
