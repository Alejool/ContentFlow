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
        Schema::create('legacy_role_migrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->onDelete('cascade');
            $table->string('legacy_role_name', 100);
            $table->json('legacy_permissions'); // Store original permissions as JSON
            $table->string('mapped_to_role', 50); // 'owner', 'admin', 'editor', 'viewer'
            $table->integer('affected_user_count')->default(0);
            $table->timestamp('migrated_at')->useCurrent();
            
            // Index for performance
            $table->index('workspace_id', 'idx_legacy_migrations_workspace');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_role_migrations');
    }
};
