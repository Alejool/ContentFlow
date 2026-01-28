<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('social_post_logs', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->nullable()->constrained()->onDelete('set null');
      $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
      $table->string('platform');
      $table->string('platform_post_id')->nullable();
      $table->enum('status', ['success', 'failed'])->default('success');
      $table->text('content')->nullable();
      $table->text('error_message')->nullable();
      $table->json('metadata')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('social_post_logs');
  }
};
