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
        Schema::table('approval_logs', function (Blueprint $table) {
            $table->foreignId('current_step_id')->nullable()->constrained('approval_steps')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_logs', function (Blueprint $table) {
            $table->dropForeign(['current_step_id']);
            $table->dropColumn('current_step_id');
        });
    }
};
