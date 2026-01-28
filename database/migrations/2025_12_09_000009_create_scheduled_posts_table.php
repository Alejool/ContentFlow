<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('scheduled_posts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->nullable()->constrained()->onDelete('cascade');
      $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
      $table->timestamp('scheduled_at');
      $table->enum('status', ['pending', 'published', 'failed'])->default('pending');
      $table->text('error_message')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('scheduled_posts');
  }
};
