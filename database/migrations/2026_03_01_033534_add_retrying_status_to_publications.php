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
        // This migration adds support for the 'retrying' status
        // Since the status column is already a string type (from previous migration),
        // no schema changes are needed. This migration serves as documentation
        // that the 'retrying' status is now a valid status value.
        
        // The available statuses are now:
        // - draft
        // - published
        // - publishing
        // - retrying (NEW)
        // - processing
        // - failed
        // - pending_review
        // - approved
        // - scheduled
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No schema changes to revert
        // Publications with 'retrying' status will need to be manually updated
        // to another valid status before removing this status from the application
    }
};
