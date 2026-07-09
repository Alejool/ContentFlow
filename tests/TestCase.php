<?php

namespace Tests;

use Database\Seeders\Auth\SimplifiedRolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Schema;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Feature tests rely on the four predefined roles carrying their
        // permissions (e.g. admin -> manage-content). The backfill migration
        // only seeds bare role rows, so seed the full RBAC set here. Guarded by
        // table existence so tests without a migrated database are unaffected.
        if (Schema::hasTable('roles') && Schema::hasTable('permissions')) {
            $this->seed(SimplifiedRolesAndPermissionsSeeder::class);
        }
    }
}
