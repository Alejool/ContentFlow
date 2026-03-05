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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Para manejar downgrades programados
            $table->string('pending_plan')->nullable()->after('plan');
            $table->timestamp('plan_changes_at')->nullable()->after('pending_plan');
            
            // Para período de gracia en pagos fallidos
            $table->timestamp('grace_period_ends_at')->nullable()->after('ends_at');
            
            // Para tracking de cancelaciones
            $table->string('cancellation_reason')->nullable()->after('grace_period_ends_at');
            $table->boolean('cancel_at_period_end')->default(false)->after('cancellation_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'pending_plan',
                'plan_changes_at',
                'grace_period_ends_at',
                'cancellation_reason',
                'cancel_at_period_end',
            ]);
        });
    }
};
