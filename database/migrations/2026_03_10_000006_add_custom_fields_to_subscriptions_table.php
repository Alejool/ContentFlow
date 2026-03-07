<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Agregar workspace_id para soportar suscripciones por workspace
            $table->foreignId('workspace_id')->nullable()->after('user_id')->constrained()->onDelete('cascade');
            
            // Agregar plan personalizado (free, starter, professional, enterprise)
            $table->string('plan')->default('free')->after('type');
            
            // Agregar status personalizado para tracking adicional
            $table->string('status')->default('active')->after('stripe_status');
            
            // Índices adicionales
            $table->index(['workspace_id', 'status']);
            $table->index('plan');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['workspace_id']);
            $table->dropIndex(['workspace_id', 'status']);
            $table->dropIndex(['plan']);
            $table->dropColumn(['workspace_id', 'plan', 'status']);
        });
    }
};
