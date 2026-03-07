<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stripe_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->onDelete('cascade');
            $table->string('stripe_invoice_id')->unique();
            $table->string('stripe_customer_id');
            $table->string('stripe_subscription_id')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('status'); // draft, open, paid, uncollectible, void
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('total', 10, 2);
            $table->string('currency', 3)->default('usd');
            $table->string('plan_name')->nullable();
            $table->text('description')->nullable();
            $table->string('invoice_pdf')->nullable();
            $table->string('hosted_invoice_url')->nullable();
            $table->timestamp('invoice_date');
            $table->timestamp('period_start')->nullable();
            $table->timestamp('period_end')->nullable();
            $table->timestamps();
            
            $table->index('workspace_id');
            $table->index('stripe_customer_id');
            $table->index('invoice_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stripe_invoices');
    }
};
