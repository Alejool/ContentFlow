<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
  public function up(): void
  {
    // For PostgreSQL, we need to alter the enum type
    DB::statement("ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_file_type_check");
    DB::statement("ALTER TABLE media_files ADD CONSTRAINT media_files_file_type_check CHECK (file_type IN ('image', 'video', 'reel'))");
  }

  public function down(): void
  {
    // Revert back to original constraint
    DB::statement("ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_file_type_check");
    DB::statement("ALTER TABLE media_files ADD CONSTRAINT media_files_file_type_check CHECK (file_type IN ('image', 'video'))");
  }
};
