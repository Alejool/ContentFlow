<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds database indexes for frequently queried columns
     * to optimize performance of RoleService, ApprovalWorkflowService, 
     * and ApprovalAnalyticsService queries.
     */
    public function up(): void
    {
        // Get existing indexes to avoid duplicates
        $existingIndexes = $this->getExistingIndexes();

        // Add index on role_user.role_id for role-based queries
        if (!in_array('idx_role_user_role', $existingIndexes['role_user'] ?? [])) {
            Schema::table('role_user', function (Blueprint $table) {
                $table->index('role_id', 'idx_role_user_role');
            });
        }

        // Add composite index on approval_actions for analytics queries
        // This helps with queries that filter by content_id and action_type together
        if (!in_array('idx_approval_actions_content_type', $existingIndexes['approval_actions'] ?? [])) {
            Schema::table('approval_actions', function (Blueprint $table) {
                $table->index(['content_id', 'action_type'], 'idx_approval_actions_content_type');
            });
        }

        // Add index on approval_actions.action_type for filtering by action type
        if (!in_array('idx_approval_actions_type', $existingIndexes['approval_actions'] ?? [])) {
            Schema::table('approval_actions', function (Blueprint $table) {
                $table->index('action_type', 'idx_approval_actions_type');
            });
        }

        // Add index on approval_actions.approval_level for level-based analytics
        if (!in_array('idx_approval_actions_level', $existingIndexes['approval_actions'] ?? [])) {
            Schema::table('approval_actions', function (Blueprint $table) {
                $table->index('approval_level', 'idx_approval_actions_level');
            });
        }

        // Add composite index on publications for workspace + status queries
        if (!in_array('idx_publications_workspace_status', $existingIndexes['publications'] ?? [])) {
            Schema::table('publications', function (Blueprint $table) {
                $table->index(['workspace_id', 'status'], 'idx_publications_workspace_status');
            });
        }

        // Add composite index on publications for workspace + status + submitted_at
        // This optimizes stale content queries
        if (!in_array('idx_publications_workspace_status_submitted', $existingIndexes['publications'] ?? [])) {
            Schema::table('publications', function (Blueprint $table) {
                $table->index(['workspace_id', 'status', 'submitted_for_approval_at'], 'idx_publications_workspace_status_submitted');
            });
        }

        // Add index on publications.workspace_id if it doesn't exist
        if (!in_array('idx_publications_workspace', $existingIndexes['publications'] ?? [])) {
            Schema::table('publications', function (Blueprint $table) {
                $table->index('workspace_id', 'idx_publications_workspace');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('role_user', function (Blueprint $table) {
            $table->dropIndex('idx_role_user_role');
        });

        Schema::table('approval_actions', function (Blueprint $table) {
            $table->dropIndex('idx_approval_actions_content_type');
            $table->dropIndex('idx_approval_actions_type');
            $table->dropIndex('idx_approval_actions_level');
        });

        Schema::table('publications', function (Blueprint $table) {
            $table->dropIndex('idx_publications_workspace_status');
            $table->dropIndex('idx_publications_workspace_status_submitted');
            $table->dropIndex('idx_publications_workspace');
        });
    }

    /**
     * Get existing indexes for tables to avoid duplicate index errors
     * 
     * @return array
     */
    private function getExistingIndexes(): array
    {
        $tables = ['role_user', 'approval_actions', 'publications'];
        $indexes = [];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $tableIndexes = DB::select("
                    SELECT indexname 
                    FROM pg_indexes 
                    WHERE tablename = ?
                ", [$table]);
                
                $indexes[$table] = array_column($tableIndexes, 'indexname');
            }
        }

        return $indexes;
    }
};
