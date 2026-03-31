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
        Schema::table('approval_workflows', function (Blueprint $table) {
            $table->boolean('was_multi_level')
                ->default(false)
                ->after('is_multi_level')
                ->comment('Indica si el workflow era multinivel antes de un downgrade de plan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('approval_workflows', function (Blueprint $table) {
            $table->dropColumn('was_multi_level');
        });
    }
};
