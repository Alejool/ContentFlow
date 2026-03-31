<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hashtag_libraries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->json('hashtags');
            $table->string('category')->nullable();
            $table->integer('usage_count')->default(0);
            $table->boolean('is_favorite')->default(false);
            $table->timestamps();

            $table->index(['workspace_id', 'category']);
            $table->index(['workspace_id', 'is_favorite']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hashtag_libraries');
    }
};
