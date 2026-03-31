<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration creates a professional approval workflow system
     * based on architectures used by Hootsuite, ContentStudio, and Buffer.
     * 
     * Key features:
     * - Multi-level approval workflows
     * - Multiple approvers per level
     * - Individual approval tracking
     * - Complete audit trail
     * - Flexible configuration (roles or specific users)
     */
    public function up(): void
    {
        // Table: approval_step_users
        // Maps specific users to approval steps (alternative to role-based)
        if (!Schema::hasTable('approval_step_users')) {
            Schema::create('approval_step_users', function (Blueprint $table) {
                $table->id();
                $table->foreignId('step_id')->constrained('approval_levels')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->timestamps();
                
                $table->unique(['step_id', 'user_id']);
                $table->index('step_id', 'idx_step_users_step');
                $table->index('user_id', 'idx_step_users_user');
            });
        }

        // Table: approval_requests
        // Tracks the current state of each publication's approval process
        if (!Schema::hasTable('approval_requests')) {
            Schema::create('approval_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('publication_id')->unique()->constrained('publications')->onDelete('cascade');
                $table->foreignId('workflow_id')->constrained('approval_workflows')->onDelete('restrict');
                $table->foreignId('current_step_id')->nullable()->constrained('approval_levels')->onDelete('set null');
                $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
                $table->foreignId('submitted_by')->constrained('users')->onDelete('set null');
                $table->timestamp('submitted_at');
                $table->timestamp('completed_at')->nullable();
                $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
                $table->text('rejection_reason')->nullable();
                $table->jsonb('metadata')->nullable(); // Priority, tags, custom fields
                $table->timestamps();
                
                $table->index('publication_id', 'idx_requests_publication');
                $table->index('workflow_id', 'idx_requests_workflow');
                $table->index('status', 'idx_requests_status');
                $table->index('current_step_id', 'idx_requests_current_step');
                $table->index('submitted_by', 'idx_requests_submitted_by');
                $table->index('submitted_at', 'idx_requests_submitted_at');
            });
        }

        // Update approval_actions table if it exists
        if (Schema::hasTable('approval_actions')) {
            Schema::table('approval_actions', function (Blueprint $table) {
                // Add request_id if not exists
                if (!Schema::hasColumn('approval_actions', 'request_id')) {
                    $table->foreignId('request_id')->nullable()->after('id')->constrained('approval_requests')->onDelete('cascade');
                    $table->index('request_id', 'idx_actions_request');
                }
                
                // Add step_id if not exists (rename from approval_level if needed)
                if (!Schema::hasColumn('approval_actions', 'step_id')) {
                    $table->foreignId('step_id')->nullable()->after('request_id')->constrained('approval_levels')->onDelete('set null');
                    $table->index('step_id', 'idx_actions_step');
                }
                
                // Add metadata if not exists
                if (!Schema::hasColumn('approval_actions', 'metadata')) {
                    $table->jsonb('metadata')->nullable()->after('comment');
                }
                
                // Update action_type enum if needed
                if (Schema::hasColumn('approval_actions', 'action_type')) {
                    // PostgreSQL: Need to use raw SQL to modify enum
                    DB::statement("
                        ALTER TABLE approval_actions 
                        DROP CONSTRAINT IF EXISTS approval_actions_action_type_check
                    ");
                    DB::statement("
                        ALTER TABLE approval_actions 
                        ADD CONSTRAINT approval_actions_action_type_check 
                        CHECK (action_type IN ('submitted', 'approved', 'rejected', 'cancelled', 'reassigned', 'timeout', 'auto_advanced', 'manual_resolution'))
                    ");
                }
            });
        }

        // Table: approval_step_approvals
        // Tracks individual approvals from each user at each step
        // Critical for "require_all_users" mode
        if (!Schema::hasTable('approval_step_approvals')) {
            Schema::create('approval_step_approvals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('request_id')->constrained('approval_requests')->onDelete('cascade');
                $table->foreignId('step_id')->constrained('approval_levels')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
                $table->text('comment')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                
                $table->unique(['request_id', 'step_id', 'user_id'], 'unique_request_step_user');
                $table->index('request_id', 'idx_step_approvals_request');
                $table->index('step_id', 'idx_step_approvals_step');
                $table->index('user_id', 'idx_step_approvals_user');
                $table->index('status', 'idx_step_approvals_status');
            });
        }

        // Update approval_workflows table
        if (Schema::hasTable('approval_workflows')) {
            Schema::table('approval_workflows', function (Blueprint $table) {
                // Add auto_publish_on_final_approval if not exists
                if (!Schema::hasColumn('approval_workflows', 'auto_publish_on_final_approval')) {
                    $table->boolean('auto_publish_on_final_approval')->default(false)->after('is_multi_level');
                }
                
                // Add require_all_approvers if not exists
                if (!Schema::hasColumn('approval_workflows', 'require_all_approvers')) {
                    $table->boolean('require_all_approvers')->default(false)->after('auto_publish_on_final_approval');
                }
            });
        }

        // Update approval_levels (steps) table
        if (Schema::hasTable('approval_levels')) {
            Schema::table('approval_levels', function (Blueprint $table) {
                // Add require_all_users if not exists
                if (!Schema::hasColumn('approval_levels', 'require_all_users')) {
                    $table->boolean('require_all_users')->default(false)->after('role_id');
                }
                
                // Add auto_advance if not exists
                if (!Schema::hasColumn('approval_levels', 'auto_advance')) {
                    $table->boolean('auto_advance')->default(true)->after('require_all_users');
                }
                
                // Add timeout_hours if not exists
                if (!Schema::hasColumn('approval_levels', 'timeout_hours')) {
                    $table->integer('timeout_hours')->nullable()->after('auto_advance');
                }
                
                // Add description if not exists
                if (!Schema::hasColumn('approval_levels', 'description')) {
                    $table->text('description')->nullable()->after('level_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order
        Schema::dropIfExists('approval_step_approvals');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_step_users');
        
        // Revert approval_workflows changes
        if (Schema::hasTable('approval_workflows')) {
            Schema::table('approval_workflows', function (Blueprint $table) {
                if (Schema::hasColumn('approval_workflows', 'auto_publish_on_final_approval')) {
                    $table->dropColumn('auto_publish_on_final_approval');
                }
                if (Schema::hasColumn('approval_workflows', 'require_all_approvers')) {
                    $table->dropColumn('require_all_approvers');
                }
            });
        }
        
        // Revert approval_levels changes
        if (Schema::hasTable('approval_levels')) {
            Schema::table('approval_levels', function (Blueprint $table) {
                if (Schema::hasColumn('approval_levels', 'require_all_users')) {
                    $table->dropColumn('require_all_users');
                }
                if (Schema::hasColumn('approval_levels', 'auto_advance')) {
                    $table->dropColumn('auto_advance');
                }
                if (Schema::hasColumn('approval_levels', 'timeout_hours')) {
                    $table->dropColumn('timeout_hours');
                }
                if (Schema::hasColumn('approval_levels', 'description')) {
                    $table->dropColumn('description');
                }
            });
        }
        
        // Revert approval_actions changes
        if (Schema::hasTable('approval_actions')) {
            Schema::table('approval_actions', function (Blueprint $table) {
                if (Schema::hasColumn('approval_actions', 'request_id')) {
                    $table->dropForeign(['request_id']);
                    $table->dropIndex('idx_actions_request');
                    $table->dropColumn('request_id');
                }
                if (Schema::hasColumn('approval_actions', 'step_id')) {
                    $table->dropForeign(['step_id']);
                    $table->dropIndex('idx_actions_step');
                    $table->dropColumn('step_id');
                }
                if (Schema::hasColumn('approval_actions', 'metadata')) {
                    $table->dropColumn('metadata');
                }
            });
        }
    }
};
