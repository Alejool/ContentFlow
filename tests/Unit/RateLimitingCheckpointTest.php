<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use Illuminate\Support\Facades\RateLimiter;

class RateLimitingCheckpointTest extends TestCase
{
    /**
     * Test that CustomRateLimiter middleware class exists
     */
    public function test_rate_limiter_middleware_class_exists(): void
    {
        $this->assertTrue(
            class_exists(\App\Http\Middleware\CustomRateLimiter::class),
            'CustomRateLimiter middleware class should exist'
        );
    }

    /**
     * Test that rate-limits configuration file exists
     */
    public function test_rate_limit_configuration_file_exists(): void
    {
        $configPath = base_path('config/rate-limits.php');
        $this->assertFileExists(
            $configPath,
            'rate-limits.php configuration file should exist at: ' . $configPath
        );
    }

    /**
     * Test that configuration has required structure
     */
    public function test_rate_limit_configuration_has_required_structure(): void
    {
        $config = require base_path('config/rate-limits.php');
        
        $this->assertIsArray($config, 'Rate limits configuration should be an array');
        $this->assertArrayHasKey('endpoints', $config, 'Configuration should have endpoints key');
        $this->assertArrayHasKey('window', $config, 'Configuration should have window key');
        $this->assertArrayHasKey('headers', $config, 'Configuration should have headers key');
    }

    /**
     * Test that configuration has different limits per endpoint
     */
    public function test_rate_limit_configuration_has_different_limits_per_endpoint(): void
    {
        $config = require base_path('config/rate-limits.php');
        $endpoints = $config['endpoints'];

        // Verify different endpoints exist
        $this->assertArrayHasKey('api.ai.generate', $endpoints);
        $this->assertArrayHasKey('api.posts.store', $endpoints);

        // Verify they have different limits
        $aiLimit = $endpoints['api.ai.generate']['default'];
        $postsLimit = $endpoints['api.posts.store']['default'];

        $this->assertNotEquals(
            $aiLimit,
            $postsLimit,
            'Different endpoints should have different limits'
        );
    }

    /**
     * Test that configuration has role-based limits
     */
    public function test_rate_limit_configuration_has_role_based_limits(): void
    {
        $config = require base_path('config/rate-limits.php');
        $aiConfig = $config['endpoints']['api.ai.generate'];

        $this->assertArrayHasKey('roles', $aiConfig);
        $this->assertArrayHasKey('admin', $aiConfig['roles']);
        $this->assertArrayHasKey('premium', $aiConfig['roles']);

        // Admin should have higher limit than default
        $this->assertGreaterThan(
            $aiConfig['default'],
            $aiConfig['roles']['admin'],
            'Admin role should have higher limit than default'
        );
    }

    /**
     * Test that middleware has required methods
     */
    public function test_rate_limiter_middleware_has_required_methods(): void
    {
        $reflection = new \ReflectionClass(\App\Http\Middleware\CustomRateLimiter::class);
        
        $this->assertTrue(
            $reflection->hasMethod('handle'),
            'CustomRateLimiter should have handle method'
        );
    }

    /**
     * Test that configuration includes authentication endpoints with strict limits
     */
    public function test_authentication_endpoints_have_strict_limits(): void
    {
        $config = require base_path('config/rate-limits.php');
        $endpoints = $config['endpoints'];

        // Auth endpoints should have stricter limits
        $this->assertArrayHasKey('auth.login', $endpoints);
        $this->assertArrayHasKey('auth.register', $endpoints);
        
        $loginLimit = $endpoints['auth.login']['default'];
        $registerLimit = $endpoints['auth.register']['default'];
        
        // Auth limits should be lower than regular API limits
        $this->assertLessThanOrEqual(
            10,
            $loginLimit,
            'Login endpoint should have strict rate limit'
        );
        
        $this->assertLessThanOrEqual(
            10,
            $registerLimit,
            'Register endpoint should have strict rate limit'
        );
    }

    /**
     * Test that default fallback configuration exists
     */
    public function test_default_fallback_configuration_exists(): void
    {
        $config = require base_path('config/rate-limits.php');
        $endpoints = $config['endpoints'];

        $this->assertArrayHasKey('default', $endpoints);
        $this->assertArrayHasKey('default', $endpoints['default']);
        $this->assertArrayHasKey('roles', $endpoints['default']);
    }
}
