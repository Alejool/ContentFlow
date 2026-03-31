<?php

namespace App\DTOs;

class WorkspaceMigrationResult
{
    public function __construct(
        public readonly int $workspaceId,
        public readonly string $workspaceName,
        public readonly int $usersAffected,
        public readonly array $roleMappings, // ['legacy_role_name' => 'new_role_name']
        public readonly array $userMigrations, // [['user_id' => int, 'old_role' => string, 'new_role' => string]]
        public readonly bool $success,
        public readonly ?string $error = null
    ) {}

    /**
     * Convert to array.
     */
    public function toArray(): array
    {
        return [
            'workspace_id' => $this->workspaceId,
            'workspace_name' => $this->workspaceName,
            'users_affected' => $this->usersAffected,
            'role_mappings' => $this->roleMappings,
            'user_migrations' => $this->userMigrations,
            'success' => $this->success,
            'error' => $this->error,
        ];
    }
}

