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
        Schema::table('workspaces', function (Blueprint $table) {
            $table->string('white_label_logo_url')->nullable();
            $table->string('white_label_primary_color')->nullable();
            $table->string('white_label_favicon_url')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('workspaces', function (Blueprint $table) {
            $table->dropColumn([
                'white_label_logo_url',
                'white_label_primary_color',
                'white_label_favicon_url'
            ]);
        });
    }
};
