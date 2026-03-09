<?php

namespace App\Integrations\Core;

use App\Integrations\Contracts\IntegrationInterface;
use App\Models\Integration;
use Illuminate\Support\Facades\Log;

abstract class BaseIntegration implements IntegrationInterface
{
    protected string $name;
    protected string $type;
    protected array $configSchema = [];

    public function getName(): string
    {
        return $this->name;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function validateConfig(array $config): bool
    {
        $schema = $this->getConfigSchema();
        
        foreach ($schema as $field => $rules) {
            if ($rules['required'] ?? false) {
                if (!isset($config[$field]) || empty($config[$field])) {
                    return false;
                }
            }
        }

        return true;
    }

    public function getConfigSchema(): array
    {
        return $this->configSchema;
    }

    public function getStatus(Integration $integration): string
    {
        try {
            if ($this->testConnection($integration)) {
                return 'active';
            }
            return 'error';
        } catch (\Exception $e) {
            Log::error("Integration status check failed: {$e->getMessage()}", [
                'integration_id' => $integration->id,
                'type' => $this->getType(),
            ]);
            return 'error';
        }
    }

    abstract public function testConnection(Integration $integration): bool;

    /**
     * Log integration activity
     */
    protected function log(Integration $integration, string $action, array $data = [], ?string $error = null): void
    {
        $integration->logs()->create([
            'action' => $action,
            'status' => $error ? 'error' : 'success',
            'data' => $data,
            'error_message' => $error,
        ]);
    }
}
