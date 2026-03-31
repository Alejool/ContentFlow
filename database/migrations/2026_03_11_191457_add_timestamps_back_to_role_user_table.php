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
        Schema::table('role_user', function (Blueprint $table) {
            // Add back created_at and updated_at if they don't exist
            if (!Schema::hasColumn('role_user', 'created_at')) {
                $table->timestamp('created_at')->nullable()->after('assigned_at');
            }
            if (!Schema::hasColumn('role_user', 'updated_at')) {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('role_user', function (Blueprint $table) {
            if (Schema::hasColumn('role_user', 'created_at')) {
                $table->dropColumn('created_at');
            }
            if (Schema::hasColumn('role_user', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
        });
    }
};
