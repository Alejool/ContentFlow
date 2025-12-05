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
        Schema::table('media_files', function (Blueprint $table) {

            // 1. Eliminar la columna collection_id si existe, y si tiene una llave foránea asociada.
            // Es buena práctica eliminar la llave foránea antes de la columna.
            // Asegúrate que el nombre de la llave foránea sea 'media_files_collection_id_foreign' (por defecto de Laravel).
            if (Schema::hasColumn('media_files', 'collection_id')) {
                // Eliminar la llave foránea anterior si existe
                $table->dropForeign(['collection_id']);
                // Eliminar la columna
                $table->dropColumn('collection_id');
            }

            // 2. Agregar la nueva columna campaign_id (UNSIGNED BIG INT)
            // 'constrained' crea automáticamente la llave foránea a la tabla 'campaigns'
            $table->foreignId('campaign_id')
                ->nullable() // Asumiendo que es opcional. Si debe ser obligatoria, elimina ->nullable()
                ->after('user_id') // Posición donde quieres que esté
                ->constrained() // Crea la llave foránea 'media_files_campaign_id_foreign'
                ->onDelete('cascade'); // Opcional: si la campaña se elimina, los archivos multimedia asociados también se eliminan
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {

            $table->dropConstrainedForeignId('campaign_id');
        });
    }
};
