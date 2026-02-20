<?php

namespace App\Services\Calendar;

class BulkOperationResult
{
    public array $successful = [];
    public array $failed = [];

    /**
     * Add a successful operation
     */
    public function addSuccess(int $publicationId): void
    {
        $this->successful[] = $publicationId;
    }

    /**
     * Add a failed operation with error details
     */
    public function addFailure(int $publicationId, string $error): void
    {
        $this->failed[] = [
            'id' => $publicationId,
            'error' => $error,
        ];
    }

    /**
     * Check if all operations were successful
     */
    public function isFullSuccess(): bool
    {
        return empty($this->failed);
    }

    /**
     * Get the count of failed operations
     */
    public function getFailureCount(): int
    {
        return count($this->failed);
    }

    /**
     * Get the count of successful operations
     */
    public function getSuccessCount(): int
    {
        return count($this->successful);
    }

    /**
     * Get a summary of the operation results
     */
    public function toArray(): array
    {
        return [
            'successful' => $this->successful,
            'failed' => $this->failed,
            'success_count' => $this->getSuccessCount(),
            'failure_count' => $this->getFailureCount(),
            'is_full_success' => $this->isFullSuccess(),
        ];
    }
}
