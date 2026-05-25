<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Agregar columna s3_key a media_files para almacenar rutas privadas de S3
     * en lugar de URLs públicas permanentes.
     */
    public function up(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            // Agregar s3_key si no existe
            if (!Schema::hasColumn('media_files', 's3_key')) {
                $table->string('s3_key')->nullable()->unique()->after('file_path')->comment('S3 private key path (e.g. workspaces/7/users/3/publications/uuid.mp4)');
            }

            // Marcar file_path como deprecado pero mantenerlo para backward compatibility
            if (Schema::hasColumn('media_files', 'file_path')) {
                // No necesitamos cambiar el tipo, solo agregamos s3_key
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            if (Schema::hasColumn('media_files', 's3_key')) {
                $table->dropColumn('s3_key');
            }
        });
    }
};
