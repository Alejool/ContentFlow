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
        Schema::disableForeignKeyConstraints();

        Schema::create('social_post_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
            $table->foreignId('scheduled_post_id')->nullable()->constrained()->onDelete('set null');
            $table->string('platform');
            $table->string('platform_post_id')->nullable();
            $table->text('content')->nullable();
            $table->json('media_urls')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->enum('status', ['published', 'failed'])->default('published');
            $table->text('error_message')->nullable();
            $table->json('engagement_data')->nullable();
            $table->timestamps();
        });

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_post_logs');
    }
};
