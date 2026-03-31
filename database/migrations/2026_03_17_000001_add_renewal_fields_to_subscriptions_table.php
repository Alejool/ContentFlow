<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds renewal tracking columns to the subscriptions table.
     * Note: grace_period_ends_at already exists from migration 2026_03_10_000007.
     */
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->integer('renewal_retry_count')->default(0)->after('grace_period_ends_at');
            $table->timestamp('last_renewal_attempt_at')->nullable()->after('renewal_retry_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['renewal_retry_count', 'last_renewal_attempt_at']);
        });
    }
};
