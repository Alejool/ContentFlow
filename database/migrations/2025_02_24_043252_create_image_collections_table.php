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
        Schema::disableForeignKeyConstraints();

        Schema::create('image_collections', function (Blueprint $table) {
            $table->integer('id');
            $table->integer('image_id');
            $table->foreign('image_id')->references('id')->on('image');
            $table->integer('collection_id');
            $table->foreign('collection_id')->references('id')->on('collection');
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('image_collections');
    }
};
