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
     * Restructure approval system according to requirements:
     * 1. approval_requests - main request tracking
     * 2. approval_logs - detailed action history for each step
     * 3. approval_levels - workflow step definitions (already exists)
     * 
     * Remove redundant tables:
     * - approval_actions (merged into approval_logs)
     * - approval_step_approvals (merged into approval_logs)
     */
    public function up(): void
    {
        // Step 1: Backup existing data if needed
        // (In production, you'd want to migrate data first)
        
        // Step 2: Drop redundant tables
        Schema::dropIfExists('approval_step_approvals');
        Schema::dropIfExists('approval_actions');
        
        // Step 3: Restructure approval_logs table
        Schema::dropIfExists('approval_logs');
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->id();
            
            // Link to approval request
            $table->foreignId('approval_request_id')
                ->constrained('approval_requests')
                ->onDelete('cascade');
            
            // Link to approval step/level
            $table->foreignId('approval_step_id')
                ->nullable()
                ->constrained('approval_levels')
                ->onDelete('set null');
            
            // User who performed the action
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->onDelete('set null');
            
            // Action performed
            $table->enum('action', [
                'submitted',      // Initial submission
                'approved',       // Approved at this level
                'rejected',       // Rejected at this level
                'reassigned',     // Reassigned to different user
                'cancelled',      // Request cancelled
                'auto_advanced'   // Auto-advanced to next level
            ]);
            
            // Level number at time of action
            $table->integer('level_number')->nullable();
            
            // Optional comment/justification
            $table->text('comment')->nullable();
            
            // Metadata (IP, user agent, etc.)
            $table->jsonb('metadata')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index('approval_request_id', 'idx_logs_request');
            $table->index('approval_step_id', 'idx_logs_step');
            $table->index('user_id', 'idx_logs_user');
            $table->index('action', 'idx_logs_action');
            $table->index('created_at', 'idx_logs_created');
        });
        
        // Step 4: Ensure approval_requests table has correct structure
        if (Schema::hasTable('approval_requests')) {
            Schema::table('approval_requests', function (Blueprint $table) {
                // Ensure all required columns exist
                if (!Schema::hasColumn('approval_requests', 'publication_id')) {
                    $table->foreignId('publication_id')
                        ->after('id')
                        ->constrained('publications')
                        ->onDelete('cascade');
                }
                
                if (!Schema::hasColumn('approval_requests', 'workflow_id')) {
                    $table->foreignId('workflow_id')
                        ->after('publication_id')
                        ->constrained('approval_workflows')
                        ->onDelete('restrict');
                }
                
                if (!Schema::hasColumn('approval_requests', 'current_step_id')) {
                    $table->foreignId('current_step_id')
                        ->nullable()
                        ->after('workflow_id')
                        ->constrained('approval_levels')
                        ->onDelete('set null');
                }
                
                if (!Schema::hasColumn('approval_requests', 'status')) {
                    $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])
                        ->default('pending')
                        ->after('current_step_id');
                }
                
                if (!Schema::hasColumn('approval_requests', 'submitted_by')) {
                    $table->foreignId('submitted_by')
                        ->after('status')
                        ->constrained('users')
                        ->onDelete('cascade');
                }
                
                if (!Schema::hasColumn('approval_requests', 'submitted_at')) {
                    $table->timestamp('submitted_at')
                        ->after('submitted_by');
                }
                
                if (!Schema::hasColumn('approval_requests', 'completed_at')) {
                    $table->timestamp('completed_at')
                        ->nullable()
                        ->after('submitted_at');
                }
                
                if (!Schema::hasColumn('approval_requests', 'completed_by')) {
                    $table->foreignId('completed_by')
                        ->nullable()
                        ->after('completed_at')
                        ->constrained('users')
                        ->onDelete('set null');
                }
                
                if (!Schema::hasColumn('approval_requests', 'rejection_reason')) {
                    $table->text('rejection_reason')
                        ->nullable()
                        ->after('completed_by');
                }
                
                if (!Schema::hasColumn('approval_requests', 'metadata')) {
                    $table->jsonb('metadata')
                        ->nullable()
                        ->after('rejection_reason');
                }
            });
            
            // Remove unique constraint on publication_id to allow multiple submissions
            try {
                Schema::table('approval_requests', function (Blueprint $table) {
                    $table->dropUnique(['publication_id']);
                });
            } catch (\Exception $e) {
                // Constraint might not exist
            }
            
            // Add index on publication_id instead
            Schema::table('approval_requests', function (Blueprint $table) {
                if (!collect(DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'approval_requests' AND indexname = 'idx_requests_publication'"))->count()) {
                    $table->index('publication_id', 'idx_requests_publication');
                }
            });
        }
        
        // Step 5: Ensure approval_levels table has correct structure
        if (Schema::hasTable('approval_levels')) {
            Schema::table('approval_levels', function (Blueprint $table) {
                // Ensure level_number exists
                if (!Schema::hasColumn('approval_levels', 'level_number')) {
                    $table->integer('level_number')->after('approval_workflow_id');
                }
                
                // Ensure level_name exists
                if (!Schema::hasColumn('approval_levels', 'level_name')) {
                    $table->string('level_name', 100)->after('level_number');
                }
                
                // Ensure role_id exists
                if (!Schema::hasColumn('approval_levels', 'role_id')) {
                    $table->foreignId('role_id')
                        ->nullable()
                        ->after('level_name')
                        ->constrained('roles')
                        ->onDelete('cascade');
                }
                
                // Ensure user_id exists (for specific user assignments)
                if (!Schema::hasColumn('approval_levels', 'user_id')) {
                    $table->foreignId('user_id')
                        ->nullable()
                        ->after('role_id')
                        ->constrained('users')
                        ->onDelete('cascade');
                }
                
                // Ensure require_all_users exists
                if (!Schema::hasColumn('approval_levels', 'require_all_users')) {
                    $table->boolean('require_all_users')
                        ->default(false)
                        ->after('user_id');
                }
                
                // Ensure auto_advance exists
                if (!Schema::hasColumn('approval_levels', 'auto_advance')) {
                    $table->boolean('auto_advance')
                        ->default(true)
                        ->after('require_all_users');
                }
                
                // Ensure description exists
                if (!Schema::hasColumn('approval_levels', 'description')) {
                    $table->text('description')
                        ->nullable()
                        ->after('auto_advance');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate approval_actions table
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('content_id')->constrained('publications')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action_type', 20);
            $table->integer('approval_level')->nullable();
            $table->text('comment')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('content_id', 'idx_approval_actions_content');
            $table->index('user_id', 'idx_approval_actions_user');
            $table->index('created_at', 'idx_approval_actions_created');
        });
        
        // Recreate approval_step_approvals table
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
        });
        
        // Drop restructured approval_logs
        Schema::dropIfExists('approval_logs');
        
        // Recreate old approval_logs structure
        Schema::create('approval_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained('publications')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('requested_at');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->enum('action', ['approved', 'rejected'])->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });
    }
};
