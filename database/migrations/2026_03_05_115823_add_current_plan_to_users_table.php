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
        Schema::table('users', function (Blueprint $table) {
            $table->string('current_plan')->default('free')->after('email_verified_at');
            $table->timestamp('plan_started_at')->nullable()->after('current_plan');
            $table->timestamp('plan_renews_at')->nullable()->after('plan_started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['current_plan', 'plan_started_at', 'plan_renews_at']);
        });
    }
};
