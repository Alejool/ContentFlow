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
        // Agregar campo country a users
        Schema::table('users', function (Blueprint $table) {
            $table->string('country', 2)->nullable()->after('email')->index();
        });

        // Agregar campo country a workspaces
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('country', 2)->nullable()->after('slug')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('country');
        });

        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn('country');
        });
    }
};
