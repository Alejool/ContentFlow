<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('analytics_rollups', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 50);       // 'publication', 'social_account'
            $table->unsignedBigInteger('entity_id');
            $table->string('period_type', 20);        // 'weekly', 'monthly'
            $table->date('period_start');
            $table->date('period_end');
            $table->string('platform', 50)->nullable();
            $table->bigInteger('views')->default(0);
            $table->bigInteger('clicks')->default(0);
            $table->bigInteger('conversions')->default(0);
            $table->bigInteger('reach')->default(0);
            $table->bigInteger('impressions')->default(0);
            $table->bigInteger('likes')->default(0);
            $table->bigInteger('comments')->default(0);
            $table->bigInteger('shares')->default(0);
            $table->bigInteger('saves')->default(0);
            $table->decimal('avg_engagement_rate', 5, 2)->default(0);
            $table->integer('data_points')->default(0);
            $table->timestamps();

            $table->unique(
                ['entity_type', 'entity_id', 'period_type', 'period_start', 'platform'],
                'analytics_rollups_unique'
            );
            $table->index(['entity_type', 'entity_id', 'period_type', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_rollups');
    }
};
