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
            // Add index for user_id (if not already exists from foreign key)
            // Add unique index for platform + account_id combination
            $table->unique(['platform', 'account_id'], 'unique_platform_account');
            
            // Add index for user_id for faster lookups
            $table->index('user_id', 'idx_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_accounts', function (Blueprint $table) {
            // Drop indexes
            $table->dropUnique('unique_platform_account');
            $table->dropIndex('idx_user');
        });
    }
};
