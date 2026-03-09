<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // rss, zapier, canva, google_drive, etc.
            $table->string('name');
            $table->string('status')->default('inactive'); // active, inactive, error
            $table->json('config')->nullable();
            $table->text('credentials')->nullable(); // encrypted
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'type']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
