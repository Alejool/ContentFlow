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
        Schema::table('onboarding_states', function (Blueprint $table) {
            // Business information fields
            $table->boolean('business_info_completed')->default(false)->after('user_id');
            $table->string('business_name')->nullable()->after('business_info_completed');
            $table->string('business_industry')->nullable()->after('business_name');
            $table->text('business_goals')->nullable()->after('business_industry');
            $table->string('business_size')->nullable()->after('business_goals');
            
            // Plan selection fields
            $table->boolean('plan_selected')->default(false)->after('business_size');
            $table->string('selected_plan')->nullable()->after('plan_selected');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_states', function (Blueprint $table) {
            $table->dropColumn([
                'business_info_completed',
                'business_name',
                'business_industry',
                'business_goals',
                'business_size',
                'plan_selected',
                'selected_plan',
            ]);
        });
    }
};
