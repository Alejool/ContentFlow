<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('gateway'); // stripe, wompi, payu, mercadopago, epayco
            $table->string('event_id'); // ID único del evento en el gateway
            $table->string('event_type')->nullable(); // checkout.session.completed, transaction.updated, etc.
            $table->string('status')->default('processed'); // processed, failed
            $table->json('payload')->nullable(); // Payload completo para auditoría
            $table->timestamps();

            // Constraint de unicidad: mismo gateway + mismo event_id = duplicado
            $table->unique(['gateway', 'event_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_events');
    }
};
