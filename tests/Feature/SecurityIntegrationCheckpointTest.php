<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Security Integration Checkpoint Test
 * 
 * This test verifies that all security components are properly implemented
 * and integrated into the application without requiring database setup.
 */
class SecurityIntegrationCheckpointTest extends TestCase
{
    /** @test */
    public function all_security_middleware_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Http\Middleware\System\CustomRateLimiter::class),
            'CustomRateLimiter middleware should exist'
        );

        $this->assertTrue(
            class_exists(\App\Http\Middleware\Auth\Require2FA::class),
            'Require2FA middleware should exist'
        );
    }

    /** @test */
    public function all_security_service_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Services\Content\FileValidatorService::class),
            'FileValidatorService should exist'
        );

        $this->assertTrue(
            class_exists(\App\Services\Content\ContentSanitizerService::class),
            'ContentSanitizerService should exist'
        );
    }

    /** @test */
    public function all_security_model_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Models\Logs\AuditLog::class),
            'AuditLog model should exist'
        );

        $this->assertTrue(
            class_exists(\App\Models\Social\SocialAccount::class),
            'SocialAccount model should exist'
        );
    }

    /** @test */
    public function all_security_cast_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Casts\EncryptedToken::class),
            'EncryptedToken cast should exist'
        );
    }

    /** @test */
    public function all_security_event_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Events\System\AuditableEvent::class),
            'AuditableEvent base class should exist'
        );

        $this->assertTrue(
            class_exists(\App\Events\System\ConfigurationChanged::class),
            'ConfigurationChanged event should exist'
        );

        $this->assertTrue(
            class_exists(\App\Events\System\RoleChanged::class),
            'RoleChanged event should exist'
        );

        $this->assertTrue(
            class_exists(\App\Events\System\SocialTokenAccessed::class),
            'SocialTokenAccessed event should exist'
        );

        $this->assertTrue(
            class_exists(\App\Events\System\AuthenticationFailed::class),
            'AuthenticationFailed event should exist'
        );

        $this->assertTrue(
            class_exists(\App\Events\System\CriticalDataDeleted::class),
            'CriticalDataDeleted event should exist'
        );
    }

    /** @test */
    public function all_security_listener_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Listeners\System\AuditLogger::class),
            'AuditLogger listener should exist'
        );
    }

    /** @test */
    public function all_security_observer_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Observers\Auth\UserObserver::class),
            'UserObserver should exist'
        );
    }

    /** @test */
    public function all_security_controller_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\Http\Controllers\Auth\TwoFactorController::class),
            'TwoFactorController should exist'
        );
    }

    /** @test */
    public function all_security_dto_classes_exist()
    {
        $this->assertTrue(
            class_exists(\App\DTOs\Content\ContentValidationResultDTO::class),
            'ContentValidationResultDTO should exist'
        );

        $this->assertTrue(
            class_exists(\App\DTOs\Content\SanitizationResult::class),
            'SanitizationResult should exist'
        );
    }

    /** @test */
    public function all_security_commands_exist()
    {
        $this->assertTrue(
            class_exists(\App\Console\Commands\System\CleanOldAuditLogs::class),
            'CleanOldAuditLogs command should exist'
        );

        $this->assertTrue(
            class_exists(\App\Console\Commands\System\RotateEncryptionKey::class),
            'RotateEncryptionKey command should exist'
        );
    }

    /** @test */
    public function rate_limits_configuration_file_exists()
    {
        $this->assertFileExists(
            config_path('api_rate_limits.php'),
            'api_rate_limits.php configuration file should exist'
        );

        $config = config('api_rate_limits');
        $this->assertIsArray($config, 'Rate limits configuration should be an array');
        $this->assertArrayHasKey('endpoints', $config, 'Configuration should have endpoints key');
        $this->assertArrayHasKey('window', $config, 'Configuration should have window key');
    }

    /** @test */
    public function rate_limits_configuration_has_required_endpoints()
    {
        $config = config('api_rate_limits.endpoints');

        $requiredEndpoints = [
            'api.ai.generate',
            'api.posts.store',
            'api.uploads.store',
            'auth.login',
        ];

        foreach ($requiredEndpoints as $endpoint) {
            $this->assertArrayHasKey(
                $endpoint,
                $config,
                "Rate limits configuration should include {$endpoint}"
            );
        }
    }

    /** @test */
    public function rate_limits_configuration_has_role_based_limits()
    {
        $endpoints = config('api_rate_limits.endpoints');
        $aiConfig = $endpoints['api.ai.generate'] ?? null;

        $this->assertNotNull($aiConfig, 'API AI generate endpoint should be configured');
        $this->assertArrayHasKey('default', $aiConfig, 'Endpoint should have default limit');
        $this->assertArrayHasKey('roles', $aiConfig, 'Endpoint should have role-based limits');
        $this->assertArrayHasKey('admin', $aiConfig['roles'], 'Should have admin role limit');
        $this->assertArrayHasKey('premium', $aiConfig['roles'], 'Should have premium role limit');
    }

    /** @test */
    public function security_migrations_exist()
    {
        $migrationsPath = database_path('migrations');
        $migrations = scandir($migrationsPath);

        $requiredMigrations = [
            'audit_logs',
            'two_factor',
            'social_accounts',
        ];

        foreach ($requiredMigrations as $migration) {
            $found = false;
            foreach ($migrations as $file) {
                if (str_contains($file, $migration)) {
                    $found = true;
                    break;
                }
            }
            $this->assertTrue($found, "Migration for {$migration} should exist");
        }
    }

    /** @test */
    public function content_sanitizer_service_can_be_instantiated()
    {
        $service = app(\App\Services\Content\ContentSanitizerService::class);
        $this->assertInstanceOf(
            \App\Services\Content\ContentSanitizerService::class,
            $service,
            'ContentSanitizerService should be instantiable'
        );
    }

    /** @test */
    public function file_validator_service_can_be_instantiated()
    {
        $service = app(\App\Services\Content\FileValidatorService::class);
        $this->assertInstanceOf(
            \App\Services\Content\FileValidatorService::class,
            $service,
            'FileValidatorService should be instantiable'
        );
    }

    /** @test */
    public function two_factor_controller_can_be_instantiated()
    {
        $controller = app(\App\Http\Controllers\Auth\TwoFactorController::class);
        $this->assertInstanceOf(
            \App\Http\Controllers\Auth\TwoFactorController::class,
            $controller,
            'TwoFactorController should be instantiable'
        );
    }

    /** @test */
    public function security_routes_are_registered()
    {
        $routes = app('router')->getRoutes();
        $routeNames = [];
        
        foreach ($routes as $route) {
            if ($name = $route->getName()) {
                $routeNames[] = $name;
            }
        }

        // Check for 2FA routes
        $this->assertContains('2fa.setup', $routeNames, '2FA setup route should be registered');
        $this->assertContains('2fa.verify', $routeNames, '2FA verify route should be registered');
    }
}
