<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->boolean('is_retrying')->default(false)->after('retry_count');
            $table->timestamp('retry_started_at')->nullable()->after('is_retrying');
        });
    }

    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropColumn(['is_retrying', 'retry_started_at']);
        });
    }
};
