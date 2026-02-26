<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, update all existing NULL values to 2
        DB::table('publications')
            ->whereNull('approved_retries_remaining')
            ->update(['approved_retries_remaining' => 2]);
        
        // Then change the column default from 0 to 2
        Schema::table('publications', function (Blueprint $table) {
            $table->integer('approved_retries_remaining')->default(2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            $table->integer('approved_retries_remaining')->default(0)->change();
        });
    }
};
