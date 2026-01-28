<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  /**
   * Run the migrations.
   */
  public function up(): void
  {
    Schema::table('publications', function (Blueprint $table) {
      Schema::table('publications', function (Blueprint $table) {
        if (!Schema::hasColumn('publications', 'rejected_by')) {
          $table->foreignId('rejected_by')->nullable()->after('approved_at')->constrained('users')->onDelete('set null');
        }
        if (!Schema::hasColumn('publications', 'rejected_at')) {
          $table->timestamp('rejected_at')->nullable()->after('rejected_by');
        }
        if (!Schema::hasColumn('publications', 'rejection_reason')) {
          $table->text('rejection_reason')->nullable()->after('rejected_at');
        }
      });
    });
  }

  /**
   * Reverse the migrations.
   */
  public function down(): void
  {
    Schema::table('publications', function (Blueprint $table) {
      // We only reliably added rejection_reason in this migration (due to overlap with 2026_01_06)
      $table->dropColumn('rejection_reason');
      // $table->dropConstrainedForeignId('rejected_by'); // Handled by 2026_01_06
      // $table->dropColumn('rejected_at'); // Handled by 2026_01_06
    });
  }
};
