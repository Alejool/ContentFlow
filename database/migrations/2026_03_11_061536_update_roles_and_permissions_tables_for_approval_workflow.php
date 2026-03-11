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
        // Add new columns to roles table
        Schema::table('roles', function (Blueprint $table) {
            $table->string('display_name', 100)->after('name')->nullable();
            $table->boolean('is_system_role')->default(true)->after('description');
            $table->boolean('approval_participant')->default(false)->after('is_system_role');
        });

        // Add display_name to permissions table
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('display_name', 100)->after('name')->nullable();
        });

        // Update permission_role table - add unique constraint if it doesn't exist
        if (!Schema::hasTable('role_permission')) {
            Schema::rename('permission_role', 'role_permission');
        }
        
        // Check if unique constraint exists before adding
        $hasUniqueConstraint = DB::select("
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'role_permission' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%role_id%permission_id%'
        ");
        
        if (empty($hasUniqueConstraint)) {
            Schema::table('role_permission', function (Blueprint $table) {
                $table->unique(['role_id', 'permission_id']);
            });
        }

        // Update workspace_user table to role_user with proper structure
        if (!Schema::hasTable('role_user')) {
            Schema::rename('workspace_user', 'role_user');
        }
        
        Schema::table('role_user', function (Blueprint $table) {
            // Check if columns exist before adding
            if (!Schema::hasColumn('role_user', 'assigned_by')) {
                $table->foreignId('assigned_by')->nullable()->after('role_id')->constrained('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('role_user', 'assigned_at')) {
                $table->timestamp('assigned_at')->default(DB::raw('CURRENT_TIMESTAMP'))->after('assigned_by');
            }
            
            // Keep created_at and updated_at - they are useful for auditing
        });
        
        // Add indexes if they don't exist
        $indexes = DB::select("
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'role_user'
        ");
        $indexNames = array_column($indexes, 'indexname');
        
        Schema::table('role_user', function (Blueprint $table) use ($indexNames) {
            if (!in_array('idx_role_user_workspace', $indexNames)) {
                $table->index('workspace_id', 'idx_role_user_workspace');
            }
            if (!in_array('idx_role_user_user', $indexNames)) {
                $table->index('user_id', 'idx_role_user_user');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert role_user changes
        Schema::table('role_user', function (Blueprint $table) {
            $table->dropIndex('idx_role_user_workspace');
            $table->dropIndex('idx_role_user_user');
            
            if (Schema::hasColumn('role_user', 'assigned_by')) {
                $table->dropForeign(['assigned_by']);
                $table->dropColumn('assigned_by');
            }
            if (Schema::hasColumn('role_user', 'assigned_at')) {
                $table->dropColumn('assigned_at');
            }
            
            $table->timestamps();
        });
        
        if (Schema::hasTable('role_user')) {
            Schema::rename('role_user', 'workspace_user');
        }

        // Revert role_permission changes
        Schema::table('role_permission', function (Blueprint $table) {
            $table->dropUnique(['role_id', 'permission_id']);
        });
        
        if (Schema::hasTable('role_permission')) {
            Schema::rename('role_permission', 'permission_role');
        }

        // Remove columns from permissions table
        Schema::table('permissions', function (Blueprint $table) {
            if (Schema::hasColumn('permissions', 'display_name')) {
                $table->dropColumn('display_name');
            }
        });

        // Remove columns from roles table
        Schema::table('roles', function (Blueprint $table) {
            if (Schema::hasColumn('roles', 'display_name')) {
                $table->dropColumn('display_name');
            }
            if (Schema::hasColumn('roles', 'is_system_role')) {
                $table->dropColumn('is_system_role');
            }
            if (Schema::hasColumn('roles', 'approval_participant')) {
                $table->dropColumn('approval_participant');
            }
        });
    }
};
