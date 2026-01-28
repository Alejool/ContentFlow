<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('photo_url')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // When reverting from text to varchar(255) PostgreSQL will fail if values exceed 255 chars.
        // Use a DB::statement with a USING clause to safely truncate on pgsql. For other drivers, fallback to Schema change.
        $connection = config('database.default');
        $driver = config("database.connections.{$connection}.driver");

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN photo_url TYPE varchar(255) USING substring(photo_url from 1 for 255)");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('photo_url', 255)->nullable()->change();
            });
        }
    }
};
