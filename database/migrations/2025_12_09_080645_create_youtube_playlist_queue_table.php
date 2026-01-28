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
        Schema::create('youtube_playlist_queue', function (Blueprint $table) {
            $table->id();
            $table->foreignId('social_post_log_id')->constrained('social_post_logs')->onDelete('cascade');
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->onDelete('set null');
            $table->string('video_id'); // YouTube video ID
            $table->string('playlist_id')->nullable(); // Target playlist ID (once found/created)
            $table->string('playlist_name'); // For finding/creating playlist
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->integer('retry_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamps();

            // Indexes for efficient querying
            $table->index(['status', 'retry_count']);
            $table->index('last_attempt_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('youtube_playlist_queue');
    }
};
