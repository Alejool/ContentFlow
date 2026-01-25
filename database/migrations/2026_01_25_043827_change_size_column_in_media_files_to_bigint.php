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
        Schema::table('media_files', function (Blueprint $table) {
            $table->bigInteger('size')->change();
        });

        if (Schema::hasTable('media_derivatives')) {
            Schema::table('media_derivatives', function (Blueprint $table) {
                if (Schema::hasColumn('media_derivatives', 'size')) {
                    $table->bigInteger('size')->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->integer('size')->change();
        });

        if (Schema::hasTable('media_derivatives')) {
            Schema::table('media_derivatives', function (Blueprint $table) {
                if (Schema::hasColumn('media_derivatives', 'size')) {
                    $table->integer('size')->change();
                }
            });
        }
    }
};
