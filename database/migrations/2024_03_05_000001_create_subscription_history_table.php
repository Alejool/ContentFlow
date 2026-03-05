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
        Schema::create('subscription_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            
            // Plan information
            $table->string('plan_name'); // free, starter, professional, enterprise
            $table->string('stripe_price_id')->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->string('billing_cycle')->default('monthly'); // monthly, yearly
            
            // Change tracking
            $table->string('change_type'); // created, upgraded, downgraded, cancelled, renewed
            $table->string('previous_plan')->nullable();
            $table->string('reason')->nullable(); // user_initiated, payment_failed, trial_ended, etc.
            
            // Dates
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            // Metadata
            $table->json('metadata')->nullable(); // Additional info like promo codes, discounts, etc.
            
            $table->timestamps();
            
            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_history');
    }
};
