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
        Schema::create('publication_recurrence_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publication_id')->constrained('publications')->onDelete('cascade');
            
            // Recurrence configuration
            $table->enum('recurrence_type', ['daily', 'weekly', 'monthly', 'yearly'])->default('daily');
            $table->integer('recurrence_interval')->default(1); // Every X days/weeks/months/years
            $table->json('recurrence_days')->nullable(); // For weekly: [0,1,2,3,4,5,6] (Sunday=0)
            $table->date('recurrence_end_date')->nullable(); // When recurrence ends
            
            // Which accounts have recurrence enabled
            // If null or empty array = all accounts
            // If has values = only those accounts
            $table->json('recurrence_accounts')->nullable();
            
            $table->timestamps();
            
            // Ensure one-to-one relationship
            $table->unique('publication_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('publication_recurrence_settings');
    }
};
