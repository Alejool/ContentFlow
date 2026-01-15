<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->json('media_urls')->nullable()->after('content');
        });

        // Fix status enum issue (enum 'success','failed' vs 'pending','published','failed')
        // Convert to string to be safe
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropColumn('media_urls');
        });
    }
};
