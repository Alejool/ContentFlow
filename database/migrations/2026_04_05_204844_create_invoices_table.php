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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->string('provider', 50); // 'stripe', 'mercadopago'
            $table->string('provider_invoice_id', 255);
            $table->string('provider_customer_id', 255);
            $table->string('provider_subscription_id', 255)->nullable();
            $table->string('invoice_number', 255)->nullable();
            $table->string('status', 50); // draft, open, paid, void, uncollectible, failed
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('plan_name', 255)->nullable();
            $table->text('description')->nullable();
            $table->text('invoice_pdf_url')->nullable();
            $table->text('hosted_invoice_url')->nullable();
            $table->timestamp('invoice_date');
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->string('sync_status', 20)->default('pending'); // pending, syncing, completed, failed
            $table->timestamp('last_synced_at')->nullable();
            $table->text('sync_error')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Composite unique constraint
            $table->unique(['provider', 'provider_invoice_id'], 'unique_provider_invoice');
            
            // Indexes
            $table->index('workspace_id');
            $table->index('invoice_date');
            $table->index('sync_status');
            $table->index(['workspace_id', 'provider', 'invoice_date'], 'idx_workspace_provider_date');
        });
        
        // Migrate existing data from stripe_invoices table
        DB::statement("
            INSERT INTO invoices (
                workspace_id, provider, provider_invoice_id, 
                provider_customer_id, provider_subscription_id,
                invoice_number, status, subtotal, tax, total, currency,
                plan_name, description, invoice_pdf_url, hosted_invoice_url,
                invoice_date, period_start, period_end,
                sync_status, last_synced_at, created_at, updated_at
            )
            SELECT 
                workspace_id, 'stripe', stripe_invoice_id,
                stripe_customer_id, stripe_subscription_id,
                invoice_number, status, subtotal, tax, total, currency,
                plan_name, description, invoice_pdf, hosted_invoice_url,
                invoice_date, period_start, period_end,
                'completed', updated_at, created_at, updated_at
            FROM stripe_invoices
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
