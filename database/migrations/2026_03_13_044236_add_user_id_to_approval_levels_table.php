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
        Schema::table('approval_levels', function (Blueprint $table) {
            // Add user_id column after role_id
            $table->foreignId('user_id')->nullable()->after('role_id')->constrained('users')->nullOnDelete();
        });
        
        // Remove the unique constraint on role_id since we now allow user_id as alternative
        Schema::table('approval_levels', function (Blueprint $table) {
            $table->dropUnique(['approval_workflow_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_levels', function (Blueprint $table) {
            // Re-add the unique constraint
            $table->unique(['approval_workflow_id', 'role_id']);
        });
        
        Schema::table('approval_levels', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
