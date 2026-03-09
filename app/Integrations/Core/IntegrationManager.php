<?php

namespace App\Integrations\Core;

use App\Integrations\Contracts\IntegrationInterface;
use App\Models\Integration;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class IntegrationManager
{
    protected array $integrations = [];

    /**
     * Register an integration
     */
    public function register(string $type, string $class): void
    {
        if (!is_subclass_of($class, IntegrationInterface::class)) {
            throw new InvalidArgumentException("Class must implement IntegrationInterface");
        }

        $this->integrations[$type] = $class;
    }

    /**
     * Get an integration instance
     */
    public function get(string $type): IntegrationInterface
    {
        if (!isset($this->integrations[$type])) {
            throw new InvalidArgumentException("Integration type '{$type}' not found");
        }

        return app($this->integrations[$type]);
    }

    /**
     * Get all registered integrations
     */
    public function all(): Collection
    {
        return collect($this->integrations)->map(function ($class, $type) {
            return app($class);
        });
    }

    /**
     * Check if an integration type is registered
     */
    public function has(string $type): bool
    {
        return isset($this->integrations[$type]);
    }

    /**
     * Get available integration types
     */
    public function getAvailableTypes(): array
    {
        return array_keys($this->integrations);
    }
}
