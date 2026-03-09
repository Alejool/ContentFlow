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
        // Agregar payment_gateway a workspace_addons
        Schema::table('workspace_addons', function (Blueprint $table) {
            $table->string('payment_gateway')->default('stripe')->after('stripe_invoice_id');
            $table->string('payment_id')->nullable()->after('payment_gateway');
            $table->foreignId('purchased_by')->nullable()->after('payment_id')->constrained('users')->onDelete('set null');
        });

        // Agregar payment_gateway a subscriptions (Cashier)
        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('subscriptions', 'payment_gateway')) {
                    $table->string('payment_gateway')->default('stripe')->after('stripe_status');
                }
                if (!Schema::hasColumn('subscriptions', 'payment_id')) {
                    $table->string('payment_id')->nullable()->after('payment_gateway');
                }
                if (!Schema::hasColumn('subscriptions', 'purchased_by')) {
                    $table->foreignId('purchased_by')->nullable()->after('payment_id')->constrained('users')->onDelete('set null');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspace_addons', function (Blueprint $table) {
            $table->dropForeign(['purchased_by']);
            $table->dropColumn(['payment_gateway', 'payment_id', 'purchased_by']);
        });

        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                if (Schema::hasColumn('subscriptions', 'purchased_by')) {
                    $table->dropForeign(['purchased_by']);
                }
                $table->dropColumn(['payment_gateway', 'payment_id', 'purchased_by']);
            });
        }
    }
};
