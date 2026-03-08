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
        Schema::table('publications', function (Blueprint $table) {
            // Array de IDs de social_accounts que tendrán recurrencia
            // Si es null o vacío, todas las cuentas seleccionadas tendrán recurrencia
            $table->json('recurrence_accounts')->nullable()->after('recurrence_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('publications', function (Blueprint $table) {
            $table->dropColumn('recurrence_accounts');
        });
    }
};
