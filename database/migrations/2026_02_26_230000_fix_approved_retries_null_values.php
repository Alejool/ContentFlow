<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update any existing NULL values to 2 (default retry count)
        DB::table('publications')
            ->whereNull('approved_retries_remaining')
            ->update(['approved_retries_remaining' => 2]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this data fix
    }
};
