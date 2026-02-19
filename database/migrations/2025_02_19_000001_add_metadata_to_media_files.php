<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      // Add metadata column if it doesn't exist
      if (!Schema::hasColumn('media_files', 'metadata')) {
        $table->jsonb('metadata')->nullable()->after('size');
      }
      
      // Add workspace_id if it doesn't exist
      if (!Schema::hasColumn('media_files', 'workspace_id')) {
        $table->foreignId('workspace_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
      }
      
      // Add publication_id if it doesn't exist
      if (!Schema::hasColumn('media_files', 'publication_id')) {
        $table->foreignId('publication_id')->nullable()->after('workspace_id')->constrained()->onDelete('set null');
      }
      
      // Add status if it doesn't exist
      if (!Schema::hasColumn('media_files', 'status')) {
        $table->string('status')->default('pending')->after('size');
      }
      
      // Add processing_error if it doesn't exist
      if (!Schema::hasColumn('media_files', 'processing_error')) {
        $table->text('processing_error')->nullable()->after('status');
      }
      
      // Add duration if it doesn't exist
      if (!Schema::hasColumn('media_files', 'duration')) {
        $table->integer('duration')->nullable()->after('size');
      }
      
      // Add youtube_type if it doesn't exist
      if (!Schema::hasColumn('media_files', 'youtube_type')) {
        $table->string('youtube_type')->nullable()->after('file_type');
      }
    });
  }

  public function down(): void
  {
    Schema::table('media_files', function (Blueprint $table) {
      $table->dropColumn([
        'metadata',
        'workspace_id',
        'publication_id',
        'status',
        'processing_error',
        'duration',
        'youtube_type'
      ]);
    });
  }
};
