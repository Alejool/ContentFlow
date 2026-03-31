<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('type'); // publications, analytics, campaigns
            $table->string('frequency'); // daily, weekly, monthly
            $table->json('recipients');
            $table->json('filters')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamp('next_send_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'is_active']);
            $table->index('next_send_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
