<?php

namespace App\DTOs;

use Carbon\Carbon;

class MigrationReport
{
    public function __construct(
        public readonly int $totalWorkspaces,
        public readonly int $totalUsersAffected,
        public readonly array $roleMapping, // ['legacy_role' => ['new_role' => string, 'count' => int]]
        public readonly array $errors, // [['workspace_id' => int, 'error' => string]]
        public readonly Carbon $completedAt
    ) {}

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'total_workspaces' => $this->totalWorkspaces,
            'total_users_affected' => $this->totalUsersAffected,
            'role_mapping' => $this->roleMapping,
            'errors' => $this->errors,
            'completed_at' => $this->completedAt->toIso8601String(),
        ];
    }

    /**
     * Convert to JSON.
     */
    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_PRETTY_PRINT);
    }
}

