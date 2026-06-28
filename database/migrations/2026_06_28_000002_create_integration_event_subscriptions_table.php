<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Central event-subscription table.
 *
 * Each row maps (workspace, channel_type, event_type) → delivery config.
 * When a system event fires, the dispatcher queries this table to find all
 * active subscriptions and delivers to each channel independently.
 *
 * channel_type values:
 *   discord, slack, telegram, teams, webhook, email
 *
 * event_type values (match App\Constants\IntegrationEvents):
 *   publication.created, publication.published, publication.approved,
 *   publication.rejected, approval.submitted, role.changed,
 *   user.created, user.removed, error.critical, ...
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integration_event_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('channel_type', 32); // discord|slack|telegram|teams|webhook|email
            $table->string('channel_name', 128)->nullable();
            $table->string('event_type', 64);   // publication.created|approval.submitted|…
            $table->json('config');              // channel-specific delivery config (url, token, chat_id…)
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->unsignedInteger('trigger_count')->default(0);
            $table->timestamps();

            $table->index(['workspace_id', 'channel_type', 'is_active']);
            $table->index(['workspace_id', 'event_type', 'is_active']);
        });

        Schema::create('integration_delivery_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subscription_id')
                ->constrained('integration_event_subscriptions')
                ->cascadeOnDelete();
            $table->string('channel_type', 32);
            $table->string('event_type', 64);
            $table->json('payload')->nullable();
            $table->string('status', 16)->default('pending'); // pending|delivered|failed
            $table->text('error_message')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['subscription_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_delivery_logs');
        Schema::dropIfExists('integration_event_subscriptions');
    }
};
