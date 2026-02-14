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
            $table->json('comment_sentiment_data')->nullable()->after('engagement_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropColumn('comment_sentiment_data');
        });
    }
};
