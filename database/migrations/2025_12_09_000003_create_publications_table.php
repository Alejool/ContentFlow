<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('publications', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('title');
      $table->string('slug');
      $table->string('image')->nullable();
      $table->enum('status', ['draft', 'published'])->default('draft');
      $table->date('start_date')->nullable();
      $table->date('end_date')->nullable();
      $table->date('publish_date')->nullable();
      $table->timestamp('scheduled_at')->nullable();
      $table->string('goal')->nullable();
      $table->text('body')->nullable();
      $table->string('url')->nullable();
      $table->string('hashtags')->nullable();
      $table->text('description')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('publications');
  }
};
