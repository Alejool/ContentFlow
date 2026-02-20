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
        Schema::create('bulk_operation_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->enum('operation_type', ['move', 'delete', 'update']);
            $table->json('event_ids');
            $table->json('previous_state');
            $table->json('new_state');
            $table->integer('successful_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->json('error_details')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index(['user_id', 'workspace_id', 'created_at'], 'idx_user_workspace_created');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bulk_operation_history');
    }
};
