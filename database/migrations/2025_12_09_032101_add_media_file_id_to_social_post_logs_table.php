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
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('media_file_id')->nullable()->after('publication_id');
            // Adding foreign key constraint is optional but recommended if media_files table is guaranteed
            $table->foreign('media_file_id')->references('id')->on('media_files')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_post_logs', function (Blueprint $table) {
            $table->dropForeign(['media_file_id']);
            $table->dropColumn('media_file_id');
        });
    }
};
