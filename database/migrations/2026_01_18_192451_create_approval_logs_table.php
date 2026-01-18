<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::create('approval_logs', function (Blueprint $table) {
      $table->id();
      $table->foreignId('publication_id')->constrained('publications')->onDelete('cascade');
      $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
      $table->timestamp('requested_at');
      $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
      $table->timestamp('reviewed_at')->nullable();
      $table->enum('action', ['approved', 'rejected'])->nullable();
      $table->text('rejection_reason')->nullable();
      $table->timestamps();

      // Indexes for better query performance
      $table->index(['publication_id', 'requested_at']);
      $table->index(['reviewed_by', 'reviewed_at']);
      $table->index('action');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::dropIfExists('approval_logs');
  }
};
