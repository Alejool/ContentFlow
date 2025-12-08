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
    Schema::table('social_post_logs', function (Blueprint $table) {
      // Campos relacionados con campañas
      if (!Schema::hasColumn('social_post_logs', 'campaign_id')) {
        $table->foreignId('campaign_id')
          ->nullable()
          ->after('scheduled_post_id')
          ->constrained('campaigns')
          ->onDelete('cascade')
          ->comment('ID de la campaña asociada');
      }

      if (!Schema::hasColumn('social_post_logs', 'media_file_id')) {
        $table->foreignId('media_file_id')
          ->nullable()
          ->after('campaign_id')
          ->constrained('media_files')
          ->onDelete('set null')
          ->comment('Archivo de media específico usado en esta publicación');
      }

      // Tipo de publicación
      if (!Schema::hasColumn('social_post_logs', 'post_type')) {
        $table->string('post_type')
          ->nullable()
          ->after('platform')
          ->comment('Tipo: video, short, image, carousel, reel, story');
      }

      // Sistema de reintentos
      if (!Schema::hasColumn('social_post_logs', 'retry_count')) {
        $table->integer('retry_count')
          ->default(0)
          ->after('error_message')
          ->comment('Número de reintentos realizados (máximo 3)');
      }

      if (!Schema::hasColumn('social_post_logs', 'last_retry_at')) {
        $table->timestamp('last_retry_at')
          ->nullable()
          ->after('retry_count')
          ->comment('Fecha y hora del último reintento');
      }

      // URL de la publicación (si no existe)
      if (!Schema::hasColumn('social_post_logs', 'post_url')) {
        $table->string('post_url', 500)
          ->nullable()
          ->after('platform_post_id')
          ->comment('URL completa de la publicación en la plataforma');
      }

      // Thumbnail/miniatura (para videos)
      if (!Schema::hasColumn('social_post_logs', 'thumbnail_url')) {
        $table->string('thumbnail_url', 500)
          ->nullable()
          ->after('media_urls')
          ->comment('URL de la miniatura del video');
      }

      // Metadata adicional de la publicación
      if (!Schema::hasColumn('social_post_logs', 'post_metadata')) {
        $table->json('post_metadata')
          ->nullable()
          ->after('engagement_data')
          ->comment('Metadata adicional: duración, dimensiones, formato, etc.');
      }

      // Índices para mejorar el rendimiento
      if (!Schema::hasIndex('social_post_logs', ['campaign_id'])) {
        $table->index('campaign_id', 'idx_campaign_id');
      }

      if (!Schema::hasIndex('social_post_logs', ['status'])) {
        $table->index('status', 'idx_status');
      }

      if (!Schema::hasIndex('social_post_logs', ['platform'])) {
        $table->index('platform', 'idx_platform');
      }

      // Índice compuesto para búsquedas comunes
      if (!Schema::hasIndex('social_post_logs', ['campaign_id', 'status'])) {
        $table->index(['campaign_id', 'status'], 'idx_campaign_status');
      }
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('social_post_logs', function (Blueprint $table) {
      // Eliminar índices
      $indexes = [
        'idx_campaign_id',
        'idx_status',
        'idx_platform',
        'idx_campaign_status'
      ];

      foreach ($indexes as $index) {
        if (Schema::hasIndex('social_post_logs', $index)) {
          $table->dropIndex($index);
        }
      }

      // Eliminar foreign keys
      if (Schema::hasColumn('social_post_logs', 'campaign_id')) {
        $table->dropForeign(['campaign_id']);
      }

      if (Schema::hasColumn('social_post_logs', 'media_file_id')) {
        $table->dropForeign(['media_file_id']);
      }

      // Eliminar columnas
      $columns = [
        'campaign_id',
        'media_file_id',
        'post_type',
        'retry_count',
        'last_retry_at',
        'post_url',
        'thumbnail_url',
        'post_metadata',
      ];

      foreach ($columns as $column) {
        if (Schema::hasColumn('social_post_logs', $column)) {
          $table->dropColumn($column);
        }
      }
    });
  }
};
