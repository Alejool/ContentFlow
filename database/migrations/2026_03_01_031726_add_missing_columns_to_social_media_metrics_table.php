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
        Schema::table('social_media_metrics', function (Blueprint $table) {
            $table->integer('reach')->default(0)->after('total_likes');
            $table->integer('impressions')->default(0)->after('reach');
            $table->integer('profile_views')->default(0)->after('impressions');
            $table->integer('total_saves')->default(0)->after('total_shares');
            $table->integer('followers_gained')->default(0)->after('following');
            $table->integer('followers_lost')->default(0)->after('followers_gained');
            $table->decimal('growth_rate', 5, 2)->default(0)->after('followers_lost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_media_metrics', function (Blueprint $table) {
            $table->dropColumn([
                'reach',
                'impressions',
                'profile_views',
                'total_saves',
                'followers_gained',
                'followers_lost',
                'growth_rate',
            ]);
        });
    }
};
