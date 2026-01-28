<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('social_accounts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('platform');
      $table->string('account_id')->nullable();
      $table->string('account_name')->nullable();
      $table->text('access_token')->nullable();
      $table->text('refresh_token')->nullable();
      $table->timestamp('token_expires_at')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamp('last_failed_at')->nullable();
      $table->integer('failure_count')->default(0);
      $table->text('account_metadata')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('social_accounts');
  }
};
