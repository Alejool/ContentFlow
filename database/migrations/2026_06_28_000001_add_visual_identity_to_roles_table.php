<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add visual identity fields to the roles table.
 *
 * color_hex  — Hex color that drives the role's visual identity across the UI.
 *              Defaults vary per slug so the upgrade is backwards-compatible.
 * icon_slug  — Optional lucide-react icon name (e.g. "crown", "shield-check").
 *              When null the frontend falls back to its hardcoded default icon.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('color_hex', 7)->nullable()->after('description')
                ->comment('Primary hex color for the role (#rrggbb)');
            $table->string('icon_slug', 64)->nullable()->after('color_hex')
                ->comment('Lucide icon name to represent this role');
        });

        // Seed sensible defaults so existing roles already look correct
        DB::table('roles')->where('slug', 'owner')
            ->update(['color_hex' => '#f59e0b', 'icon_slug' => 'crown']);

        DB::table('roles')->where('slug', 'admin')
            ->update(['color_hex' => '#6366f1', 'icon_slug' => 'shield-check']);

        DB::table('roles')->where('slug', 'editor')
            ->update(['color_hex' => '#6366f1', 'icon_slug' => 'pencil-line']);

        DB::table('roles')->where('slug', 'member')
            ->update(['color_hex' => '#6366f1', 'icon_slug' => 'user']);

        DB::table('roles')->where('slug', 'viewer')
            ->update(['color_hex' => '#6b7280', 'icon_slug' => 'eye']);
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn(['color_hex', 'icon_slug']);
        });
    }
};
