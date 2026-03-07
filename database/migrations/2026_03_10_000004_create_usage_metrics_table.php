<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usage_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->string('metric_type'); // publications, storage, ai_requests
            $table->integer('current_usage')->default(0);
            $table->integer('limit')->default(0); // -1 = unlimited
            $table->date('period_start');
            $table->date('period_end');
            $table->timestamps();

            $table->index(['workspace_id', 'metric_type', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usage_metrics');
    }
};
