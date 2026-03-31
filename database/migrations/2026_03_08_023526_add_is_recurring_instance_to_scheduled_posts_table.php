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
        Schema::table('scheduled_posts', function (Blueprint $table) {
            // Add field to differentiate between original/manual posts and recurring instances
            // false = original post created by user (the base/first scheduled date)
            // true = automatically generated recurring instance
            $table->boolean('is_recurring_instance')->default(false)->after('status');
            
            // Add index for better query performance
            $table->index(['publication_id', 'is_recurring_instance']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scheduled_posts', function (Blueprint $table) {
            $table->dropIndex(['publication_id', 'is_recurring_instance']);
            $table->dropColumn('is_recurring_instance');
        });
    }
};
