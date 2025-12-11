<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('status_new', ['active', 'inactive', 'completed', 'deleted', 'paused'])
                ->nullable()
                ->default('active');
        });

        DB::statement("
            UPDATE campaigns 
            SET status_new = CASE 
                WHEN status = 'active' THEN 'active'
                WHEN status = 'published' THEN 'active'
                WHEN status = 'draft' THEN 'inactive'
                WHEN status = 'inactive' THEN 'inactive'
                WHEN status = 'completed' THEN 'completed'
                WHEN status = 'deleted' THEN 'deleted'
                WHEN status = 'paused' THEN 'paused'
                ELSE 'active'
            END
        ");

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->renameColumn('status_new', 'status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('status_old', ['active', 'inactive', 'completed', 'deleted', 'paused', 'draft', 'published'])
                ->nullable()
                ->default('active');
        });

        DB::statement("
            UPDATE campaigns 
            SET status_old = CASE 
                WHEN status = 'active' THEN 'published'  -- active → published
                WHEN status = 'inactive' THEN 'draft'    -- inactive → draft
                WHEN status = 'completed' THEN 'completed'
                WHEN status = 'deleted' THEN 'deleted'
                WHEN status = 'paused' THEN 'paused'
                ELSE 'published'
            END
        ");

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->renameColumn('status_old', 'status');
        });
    }
};
