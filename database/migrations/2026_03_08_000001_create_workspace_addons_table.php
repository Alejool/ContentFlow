<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_addons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->string('addon_type'); // 'ai_credits', 'storage'
            $table->string('addon_sku'); // 'ai_100', 'ai_500', 'storage_10gb', etc.
            $table->integer('quantity')->default(1); // Cantidad de paquetes comprados
            $table->integer('total_amount'); // Total de créditos/GB comprados
            $table->integer('used_amount')->default(0); // Cantidad usada
            $table->decimal('price_paid', 10, 2); // Precio pagado
            $table->string('stripe_payment_intent_id')->nullable();
            $table->string('stripe_invoice_id')->nullable();
            $table->timestamp('purchased_at');
            $table->timestamp('expires_at')->nullable(); // Opcional: fecha de expiración
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workspace_id', 'addon_type', 'is_active']);
            $table->index(['workspace_id', 'expires_at']);
        });

        // Agregar columna generada para PostgreSQL
        DB::statement('ALTER TABLE workspace_addons ADD COLUMN remaining_amount INTEGER GENERATED ALWAYS AS (total_amount - used_amount) STORED');
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_addons');
    }
};
