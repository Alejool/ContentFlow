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
        Schema::create('campaign_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->date('date');
            
            // Traffic metrics
            $table->integer('views')->default(0);
            $table->integer('unique_visitors')->default(0);
            $table->integer('clicks')->default(0);
            $table->integer('conversions')->default(0);
            
            // Engagement metrics
            $table->integer('likes')->default(0);
            $table->integer('comments')->default(0);
            $table->integer('shares')->default(0);
            $table->integer('saves')->default(0);
            
            // Reach metrics
            $table->integer('reach')->default(0);
            $table->integer('impressions')->default(0);
            
            // Calculated metrics (stored for performance)
            $table->decimal('ctr', 5, 2)->default(0); // Click-through rate
            $table->decimal('conversion_rate', 5, 2)->default(0);
            $table->decimal('engagement_rate', 5, 2)->default(0);
            
            $table->timestamps();

            // Indexes
            $table->unique(['campaign_id', 'date']);
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaign_analytics');
    }
};
