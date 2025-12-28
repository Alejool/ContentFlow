<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'social_accounts',
            'publications',
            'campaigns',
            'media_files',
            'scheduled_posts',
            'social_post_logs',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                // Nullable initially for migration flow
                $table->foreignId('workspace_id')->after('user_id')->nullable()->constrained()->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'social_accounts',
            'publications',
            'campaigns',
            'media_files',
            'scheduled_posts',
            'social_post_logs',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('workspace_id');
            });
        }
    }
};
