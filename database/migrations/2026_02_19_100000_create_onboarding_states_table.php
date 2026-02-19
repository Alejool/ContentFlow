<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('onboarding_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->boolean('tour_completed')->default(false);
            $table->boolean('tour_skipped')->default(false);
            $table->integer('tour_current_step')->default(0);
            $table->json('tour_completed_steps')->default('[]');
            $table->boolean('wizard_completed')->default(false);
            $table->boolean('wizard_skipped')->default(false);
            $table->integer('wizard_current_step')->default(0);
            $table->boolean('template_selected')->default(false);
            $table->string('template_id')->nullable();
            $table->json('dismissed_tooltips')->default('[]');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamps();

            // Indexes
            $table->unique('user_id');
            $table->index('completed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('onboarding_states');
    }
};
