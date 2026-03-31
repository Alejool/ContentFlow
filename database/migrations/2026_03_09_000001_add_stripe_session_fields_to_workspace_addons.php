<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workspace_addons', function (Blueprint $table) {
            $table->string('stripe_session_id')->nullable()->after('stripe_invoice_id');
            $table->string('stripe_customer_id')->nullable()->after('stripe_session_id');
            $table->string('currency', 3)->default('usd')->after('price_paid');
        });
    }

    public function down(): void
    {
        Schema::table('workspace_addons', function (Blueprint $table) {
            $table->dropColumn(['stripe_session_id', 'stripe_customer_id', 'currency']);
        });
    }
};
