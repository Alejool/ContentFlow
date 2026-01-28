<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('media_derivatives', function (Blueprint $table) {
      $table->id();
      $table->foreignId('media_file_id')->constrained()->onDelete('cascade');
      $table->enum('derivative_type', ['thumbnail', 'platform_variant', 'watermarked', 'compressed', 'preview']);
      $table->string('file_path');
      $table->string('file_name');
      $table->string('mime_type')->nullable();
      $table->integer('size');
      $table->integer('width')->nullable();
      $table->integer('height')->nullable();
      $table->string('platform')->nullable();
      $table->json('metadata')->nullable();
      $table->timestamps();

      $table->index(['media_file_id', 'derivative_type']);
      $table->index(['derivative_type', 'platform']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('media_derivatives');
  }
};
