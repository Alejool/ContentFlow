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
        // Only add index if content_type column exists
        if (Schema::hasColumn('publications', 'content_type')) {
            Schema::table('publications', function (Blueprint $table) {
                $table->index('content_type', 'publications_content_type_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('publications', 'content_type')) {
            Schema::table('publications', function (Blueprint $table) {
                $table->dropIndex('publications_content_type_index');
            });
        }
    }
};
