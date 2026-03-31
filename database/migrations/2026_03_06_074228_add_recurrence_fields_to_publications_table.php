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
        Schema::table('publications', function (Blueprint $table) {
            $table->boolean('is_recurring')->default(false)->after('status');
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly', 'yearly'])->nullable()->after('is_recurring');
            $table->integer('recurrence_interval')->default(1)->nullable()->after('recurrence_type');
            $table->json('recurrence_days')->nullable()->after('recurrence_interval');
            $table->date('recurrence_end_date')->nullable()->after('recurrence_days');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            $table->dropColumn(['is_recurring', 'recurrence_type', 'recurrence_interval', 'recurrence_days', 'recurrence_end_date']);
        });
    }
};
