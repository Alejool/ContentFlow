<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::create('campaign_publication', function (Blueprint $table) {
      $table->id();
      $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->constrained()->onDelete('cascade');
      $table->integer('order')->default(0);
      $table->timestamps();

      $table->unique(['campaign_id', 'publication_id']);
      $table->index(['campaign_id', 'order']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('campaign_publication');
  }
};
