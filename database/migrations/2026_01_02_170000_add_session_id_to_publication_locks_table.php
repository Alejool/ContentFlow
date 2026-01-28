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
        Schema::table('publication_locks', function (Blueprint $blueprint) {
            $blueprint->string('session_id')->nullable()->after('user_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publication_locks', function (Blueprint $blueprint) {
            $blueprint->dropColumn('session_id');
        });
    }
};
