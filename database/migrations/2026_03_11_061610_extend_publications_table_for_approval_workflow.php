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
        Schema::table('publications', function (Blueprint $table) {
            // Modify existing status column to include new values
            $table->dropColumn('status');
        });
        
        Schema::table('publications', function (Blueprint $table) {
            // Add status column with new enum values
            $table->enum('status', ['draft', 'pending_review', 'approved', 'rejected', 'published'])
                ->default('draft')
                ->after('image');
            
            // Add approval workflow columns if they don't exist
            if (!Schema::hasColumn('publications', 'current_approval_level')) {
                $table->integer('current_approval_level')->default(0)->after('status');
            }
            if (!Schema::hasColumn('publications', 'submitted_for_approval_at')) {
                $table->timestamp('submitted_for_approval_at')->nullable()->after('current_approval_level');
            }
            // approved_at already exists, skip it
            if (!Schema::hasColumn('publications', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('approved_at');
            }
            
            // Add indexes for performance
            $table->index('status', 'idx_publications_status');
            $table->index('current_approval_level', 'idx_publications_approval_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('idx_publications_status');
            $table->dropIndex('idx_publications_approval_level');
            
            // Drop new columns
            if (Schema::hasColumn('publications', 'current_approval_level')) {
                $table->dropColumn('current_approval_level');
            }
            if (Schema::hasColumn('publications', 'submitted_for_approval_at')) {
                $table->dropColumn('submitted_for_approval_at');
            }
            if (Schema::hasColumn('publications', 'published_at')) {
                $table->dropColumn('published_at');
            }
            // Keep approved_at as it existed before
            
            // Drop modified status column
            $table->dropColumn('status');
        });
        
        Schema::table('publications', function (Blueprint $table) {
            // Restore original status column
            $table->enum('status', ['draft', 'published'])->default('draft')->after('image');
        });
    }
};
