<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            DB::statement("ALTER TABLE campaigns MODIFY COLUMN status ENUM('active', 'paused', 'completed', 'draft', 'published') DEFAULT 'draft'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            DB::statement("ALTER TABLE campaigns MODIFY COLUMN status ENUM('active', 'paused', 'completed', 'draft') DEFAULT 'draft'");
        });
    }
};
