<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      // Check if campaign_id exists and publication_id doesn't
      if (Schema::hasColumn('media_files', 'campaign_id') && !Schema::hasColumn('media_files', 'publication_id')) {
        $table->renameColumn('campaign_id', 'publication_id');
      }
    });
  }

  public function down(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      // Revert back to campaign_id
      if (Schema::hasColumn('media_files', 'publication_id') && !Schema::hasColumn('media_files', 'campaign_id')) {
        $table->renameColumn('publication_id', 'campaign_id');
      }
    });
  }
};
