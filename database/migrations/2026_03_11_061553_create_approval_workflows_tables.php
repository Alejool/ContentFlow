<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing approval_workflows table to match design spec
        Schema::table('approval_workflows', function (Blueprint $table) {
            // Add new columns if they don't exist
            if (!Schema::hasColumn('approval_workflows', 'is_enabled')) {
                $table->boolean('is_enabled')->default(false)->after('workspace_id');
            }
            if (!Schema::hasColumn('approval_workflows', 'is_multi_level')) {
                $table->boolean('is_multi_level')->default(false)->after('is_enabled');
            }
        });
        
        // Make workspace_id unique
        $uniqueConstraints = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'approval_workflows' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%workspace_id%'
        ");
        
        if (empty($uniqueConstraints)) {
            Schema::table('approval_workflows', function (Blueprint $table) {
                $table->unique('workspace_id');
            });
        }

        // Rename approval_steps to approval_levels if it exists
        if (Schema::hasTable('approval_steps')) {
            Schema::rename('approval_steps', 'approval_levels');
            
            // Update structure - drop user_id if it exists
            if (Schema::hasColumn('approval_levels', 'user_id')) {
                // Drop foreign key using raw SQL to avoid transaction issues
                DB::statement('ALTER TABLE approval_levels DROP CONSTRAINT IF EXISTS approval_levels_user_id_foreign');
                
                Schema::table('approval_levels', function (Blueprint $table) {
                    $table->dropColumn('user_id');
                });
            }
            
            // Rename columns
            Schema::table('approval_levels', function (Blueprint $table) {
                if (Schema::hasColumn('approval_levels', 'workflow_id')) {
                    $table->renameColumn('workflow_id', 'approval_workflow_id');
                }
                if (Schema::hasColumn('approval_levels', 'step_order')) {
                    $table->renameColumn('step_order', 'level_number');
                }
                if (Schema::hasColumn('approval_levels', 'name')) {
                    $table->renameColumn('name', 'level_name');
                }
            });
            
            // Make level_name not nullable and set proper length
            Schema::table('approval_levels', function (Blueprint $table) {
                if (Schema::hasColumn('approval_levels', 'level_name')) {
                    $table->string('level_name', 100)->nullable(false)->change();
                }
                
                // Note: We keep role_id nullable to avoid issues with existing data
                // The application layer will enforce that role_id is required
            });
            
            // Add unique constraints and indexes
            Schema::table('approval_levels', function (Blueprint $table) {
                $table->unique(['approval_workflow_id', 'level_number']);
                $table->unique(['approval_workflow_id', 'role_id']);
                $table->index('approval_workflow_id', 'idx_approval_levels_workflow');
            });
        }

        // Create approval_actions table (audit trail)
        if (!Schema::hasTable('approval_actions')) {
            Schema::create('approval_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('content_id')->constrained('publications')->onDelete('cascade');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('action_type', 20); // 'submitted', 'approved', 'rejected'
                $table->integer('approval_level')->nullable(); // NULL for simple workflow, 1-5 for multi-level
                $table->text('comment')->nullable();
                $table->timestamp('created_at')->useCurrent();
                
                // Indexes for performance
                $table->index('content_id', 'idx_approval_actions_content');
                $table->index('user_id', 'idx_approval_actions_user');
                $table->index('created_at', 'idx_approval_actions_created');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop approval_actions table
        Schema::dropIfExists('approval_actions');

        // Revert approval_levels changes
        if (Schema::hasTable('approval_levels')) {
            Schema::table('approval_levels', function (Blueprint $table) {
                $table->dropIndex('idx_approval_levels_workflow');
                $table->dropUnique(['approval_workflow_id', 'level_number']);
                $table->dropUnique(['approval_workflow_id', 'role_id']);
            });
            
            Schema::table('approval_levels', function (Blueprint $table) {
                if (Schema::hasColumn('approval_levels', 'approval_workflow_id')) {
                    $table->renameColumn('approval_workflow_id', 'workflow_id');
                }
                if (Schema::hasColumn('approval_levels', 'level_number')) {
                    $table->renameColumn('level_number', 'step_order');
                }
                if (Schema::hasColumn('approval_levels', 'level_name')) {
                    $table->renameColumn('level_name', 'name');
                }
            });
            
            Schema::table('approval_levels', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('role_id')->constrained()->nullOnDelete();
            });
            
            Schema::rename('approval_levels', 'approval_steps');
        }

        // Revert approval_workflows changes
        Schema::table('approval_workflows', function (Blueprint $table) {
            $uniqueConstraints = DB::select("
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'approval_workflows' 
                AND constraint_type = 'UNIQUE'
                AND constraint_name LIKE '%workspace_id%'
            ");
            
            if (!empty($uniqueConstraints)) {
                $table->dropUnique(['workspace_id']);
            }
            
            if (Schema::hasColumn('approval_workflows', 'is_enabled')) {
                $table->dropColumn('is_enabled');
            }
            if (Schema::hasColumn('approval_workflows', 'is_multi_level')) {
                $table->dropColumn('is_multi_level');
            }
        });
    }
};
