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
        Schema::table('approval_requests', function (Blueprint $table) {
            // Make workflow_id nullable to support simple approvals without workflow
            $table->unsignedBigInteger('workflow_id')->nullable()->change();
            
            // Make current_step_id nullable as well (it already should be, but ensure it)
            $table->unsignedBigInteger('current_step_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_requests', function (Blueprint $table) {
            // Revert workflow_id to NOT NULL
            // Note: This will fail if there are records with NULL workflow_id
            $table->unsignedBigInteger('workflow_id')->nullable(false)->change();
            $table->unsignedBigInteger('current_step_id')->nullable(false)->change();
        });
    }
};
