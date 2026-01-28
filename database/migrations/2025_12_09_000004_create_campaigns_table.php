<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('campaigns', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('name');
      $table->text('description')->nullable();
      $table->enum('status', ['active', 'paused', 'completed', 'draft'])->default('draft');
      $table->date('start_date')->nullable();
      $table->date('end_date')->nullable();
      $table->string('goal')->nullable();
      $table->decimal('budget', 10, 2)->nullable();
      $table->timestamps();
      $table->softDeletes();

      $table->index(['user_id', 'status']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('campaigns');
  }
};
