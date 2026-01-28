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
            $blueprint->string('ip_address', 45)->nullable()->after('session_id');
            $blueprint->text('user_agent')->nullable()->after('ip_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publication_locks', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['ip_address', 'user_agent']);
        });
    }
};
