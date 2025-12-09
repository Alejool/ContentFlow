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
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('publication_id')->nullable()->constrained('publications')->nullOnDelete();
            $table->foreignId('social_post_log_id')->nullable()->constrained('social_post_logs')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['publication_id']);
            $table->dropColumn('publication_id');
            $table->dropForeign(['social_post_log_id']);
            $table->dropColumn('social_post_log_id');
        });
    }
};
