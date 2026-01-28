<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('media_files', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('campaign_id')->nullable()->constrained('publications')->onDelete('set null');
      $table->string('file_name');
      $table->string('file_path');
      $table->enum('file_type', ['image', 'video']);
      $table->string('mime_type')->nullable();
      $table->integer('size');
      $table->boolean('is_miniatura')->default(0);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('media_files');
  }
};
