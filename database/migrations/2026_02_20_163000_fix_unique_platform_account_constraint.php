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
        Schema::table('social_accounts', function (Blueprint $table) {
            // Drop the old constraint that only includes platform + account_id
            $table->dropUnique('unique_platform_account');
            
            // Add new constraint that includes workspace_id to allow the same account
            // to be connected by different workspaces
            $table->unique(['platform', 'account_id', 'workspace_id'], 'unique_platform_account_workspace');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            // Restore the old constraint
            $table->dropUnique('unique_platform_account_workspace');
            $table->unique(['platform', 'account_id'], 'unique_platform_account');
        });
    }
};
