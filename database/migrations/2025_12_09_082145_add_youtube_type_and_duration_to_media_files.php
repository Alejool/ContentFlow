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
        Schema::table('media_files', function (Blueprint $table) {
            // Add youtube_type column: 'short' or 'video'
            $table->enum('youtube_type', ['short', 'video'])->nullable()->after('file_type');

            // Add duration in seconds
            $table->integer('duration')->nullable()->after('youtube_type')->comment('Video duration in seconds');

            // Add index for filtering
            $table->index(['file_type', 'youtube_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->dropIndex(['file_type', 'youtube_type']);
            $table->dropColumn(['youtube_type', 'duration']);
        });
    }
};
