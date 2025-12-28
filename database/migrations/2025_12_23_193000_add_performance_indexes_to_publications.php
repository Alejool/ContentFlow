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
        $this->addIndexIfMissing('social_post_logs', ['publication_id', 'social_account_id', 'status'], 'idx_logs_pub_account_status');
        $this->addIndexIfMissing('social_post_logs', ['publication_id', 'status'], 'idx_logs_pub_status');
        $this->addIndexIfMissing('scheduled_posts', ['publication_id', 'status'], 'idx_scheduled_pub_status');
        $this->addIndexIfMissing('scheduled_posts', ['publication_id', 'social_account_id'], 'idx_scheduled_pub_account');
    }

    private function addIndexIfMissing(string $table, array $columns, string $indexName): void
    {
        $indexes = DB::select("SHOW INDEX FROM {$table} WHERE Key_name = ?", [$indexName]);
        if (empty($indexes)) {
            Schema::table($table, function (Blueprint $table) use ($columns, $indexName) {
                $table->index($columns, $indexName);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropIndex('idx_logs_pub_account_status');
            $table->dropIndex('idx_logs_pub_status');
        });

        Schema::table('scheduled_posts', function (Blueprint $table) {
            $table->dropIndex('idx_scheduled_pub_status');
            $table->dropIndex('idx_scheduled_pub_account');
        });
    }
};
