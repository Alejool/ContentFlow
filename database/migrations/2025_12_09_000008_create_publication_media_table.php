<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('publication_media', function (Blueprint $table) {
      $table->id();
      $table->foreignId('publication_id')->constrained()->onDelete('cascade');
      $table->foreignId('media_file_id')->constrained()->onDelete('cascade');
      $table->integer('order')->default(0);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('publication_media');
  }
};
