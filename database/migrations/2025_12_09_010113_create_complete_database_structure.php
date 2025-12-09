w?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
  public function up(): void
  {
    // Users table
    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('email')->unique();
      $table->timestamp('email_verified_at')->nullable();
      $table->string('password');
      $table->string('locale')->default('en');
      $table->string('theme')->default('light');
      $table->string('photo_url')->nullable();
      $table->string('provider')->nullable();
      $table->string('provider_id')->nullable();
      $table->rememberToken();
      $table->timestamps();
    });

    // Social accounts table
    Schema::create('social_accounts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('platform');
      $table->string('account_id')->nullable();
      $table->string('account_name')->nullable();
      $table->text('access_token')->nullable();
      $table->text('refresh_token')->nullable();
      $table->timestamp('token_expires_at')->nullable();
      $table->boolean('is_active')->default(true);
      $table->timestamp('last_failed_at')->nullable();
      $table->integer('failure_count')->default(0);
      $table->text('account_metadata')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });

    // Publications table (renamed from campaigns)
    Schema::create('publications', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('title');
      $table->string('slug');
      $table->string('image')->nullable();
      $table->enum('status', ['draft', 'published'])->default('draft');
      $table->date('start_date')->nullable();
      $table->date('end_date')->nullable();
      $table->date('publish_date')->nullable();
      $table->timestamp('scheduled_at')->nullable();
      $table->string('goal')->nullable();
      $table->text('body')->nullable();
      $table->string('url')->nullable();
      $table->string('hashtags')->nullable();
      $table->text('description')->nullable();
      $table->timestamps();
    });

    // Media files table
    Schema::create('media_files', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('campaign_id')->nullable()->constrained('publications')->onDelete('set null');
      $table->string('file_name');
      $table->string('file_path');
      $table->enum('file_type', ['image', 'video']);
      $table->string('mime_type')->nullable();
      $table->integer('size');
      $table->boolean('is_miniatura')->default(0);
      $table->timestamps();
    });

    // Media derivatives table (NEW)
    Schema::create('media_derivatives', function (Blueprint $table) {
      $table->id();
      $table->foreignId('media_file_id')->constrained()->onDelete('cascade');
      $table->enum('derivative_type', ['thumbnail', 'platform_variant', 'watermarked', 'compressed', 'preview']);
      $table->string('file_path');
      $table->string('file_name');
      $table->string('mime_type')->nullable();
      $table->integer('size');
      $table->integer('width')->nullable();
      $table->integer('height')->nullable();
      $table->string('platform')->nullable();
      $table->json('metadata')->nullable();
      $table->timestamps();

      $table->index(['media_file_id', 'derivative_type']);
      $table->index(['derivative_type', 'platform']);
    });

    // Publication media pivot table
    Schema::create('publication_media', function (Blueprint $table) {
      $table->id();
      $table->foreignId('publication_id')->constrained()->onDelete('cascade');
      $table->foreignId('media_file_id')->constrained()->onDelete('cascade');
      $table->integer('order')->default(0);
      $table->timestamps();
    });

    // Campaigns table (NEW - for grouping publications)
    Schema::create('campaigns', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->string('name');
      $table->text('description')->nullable();
      $table->enum('status', ['active', 'paused', 'completed', 'draft'])->default('draft');
      $table->date('start_date')->nullable();
      $table->date('end_date')->nullable();
      $table->string('goal')->nullable();
      $table->decimal('budget', 10, 2)->nullable();
      $table->timestamps();
      $table->softDeletes();

      $table->index(['user_id', 'status']);
    });

    // Campaign publication pivot table
    Schema::create('campaign_publication', function (Blueprint $table) {
      $table->id();
      $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->constrained()->onDelete('cascade');
      $table->integer('order')->default(0);
      $table->timestamps();

      $table->unique(['campaign_id', 'publication_id']);
      $table->index(['campaign_id', 'order']);
    });

    // Scheduled posts table
    Schema::create('scheduled_posts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->nullable()->constrained()->onDelete('cascade');
      $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
      $table->timestamp('scheduled_at');
      $table->enum('status', ['pending', 'published', 'failed'])->default('pending');
      $table->text('error_message')->nullable();
      $table->timestamps();
      $table->softDeletes();
    });

    // Social post logs table
    Schema::create('social_post_logs', function (Blueprint $table) {
      $table->id();
      $table->foreignId('user_id')->constrained()->onDelete('cascade');
      $table->foreignId('publication_id')->nullable()->constrained()->onDelete('set null');
      $table->foreignId('social_account_id')->constrained()->onDelete('cascade');
      $table->string('platform');
      $table->string('platform_post_id')->nullable();
      $table->enum('status', ['success', 'failed'])->default('success');
      $table->text('content')->nullable();
      $table->text('error_message')->nullable();
      $table->json('metadata')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('social_post_logs');
    Schema::dropIfExists('scheduled_posts');
    Schema::dropIfExists('campaign_publication');
    Schema::dropIfExists('campaigns');
    Schema::dropIfExists('publication_media');
    Schema::dropIfExists('media_derivatives');
    Schema::dropIfExists('media_files');
    Schema::dropIfExists('publications');
    Schema::dropIfExists('social_accounts');
    Schema::dropIfExists('users');
  }
};
