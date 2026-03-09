<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integration_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // google, dropbox, shopify, etc.
            $table->text('access_token'); // encrypted
            $table->text('refresh_token')->nullable(); // encrypted
            $table->timestamp('expires_at')->nullable();
            $table->json('scopes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['integration_id', 'user_id']);
            $table->index('provider');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_connections');
    }
};
