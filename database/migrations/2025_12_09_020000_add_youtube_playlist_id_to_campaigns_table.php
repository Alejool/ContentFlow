<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('campaigns', function (Blueprint $table) {
      $table->string('youtube_playlist_id')->nullable()->after('budget');
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('campaigns', function (Blueprint $table) {
      $table->dropColumn('youtube_playlist_id');
    });
  }
};
