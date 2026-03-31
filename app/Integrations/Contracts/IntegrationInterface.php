<?php

namespace App\Integrations\Contracts;

use App\Models\Integration;

interface IntegrationInterface
{
    /**
     * Get the integration name
     */
    public function getName(): string;

    /**
     * Get the integration type identifier
     */
    public function getType(): string;

    /**
     * Validate the integration configuration
     */
    public function validateConfig(array $config): bool;

    /**
     * Test the integration connection
     */
    public function testConnection(Integration $integration): bool;

    /**
     * Get the configuration schema
     */
    public function getConfigSchema(): array;

    /**
     * Get the integration status
     */
    public function getStatus(Integration $integration): string;
}
