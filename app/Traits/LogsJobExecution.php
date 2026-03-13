<?php

namespace App\Traits;

use App\Helpers\LogHelper;
use Throwable;

/**
 * Trait para agregar logging automático a Jobs
 * 
 * Uso:
 * class MyJob implements ShouldQueue
 * {
 *     use LogsJobExecution;
 *     
 *     protected function getJobContext(): array
 *     {
 *         return ['file' => $this->filename];
 *     }
 * }
 */
trait LogsJobExecution
{
    /**
     * Hook que se ejecuta antes del handle()
     */
    public function beforeHandle(): void
    {
        $startTime = microtime(true);
        $this->jobStartTime = $startTime;

        LogHelper::job('job.started', array_merge([
            'job' => static::class,
            'queue' => $this->queue ?? 'default',
            'attempt' => $this->attempts(),
        ], $this->getJobContext()));
    }

    /**
     * Hook que se ejecuta después del handle()
     */
    public function afterHandle(): void
    {
        $duration = microtime(true) - ($this->jobStartTime ?? microtime(true));

        LogHelper::job('job.completed', array_merge([
            'job' => static::class,
            'duration' => round($duration, 3),
        ], $this->getJobContext()));
    }

    /**
     * Hook cuando el job falla
     */
    public function failed(Throwable $exception): void
    {
        LogHelper::jobError('job.failed', $exception->getMessage(), array_merge([
            'job' => static::class,
            'attempt' => $this->attempts(),
            'exception' => get_class($exception),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
        ], $this->getJobContext()));
    }

    /**
     * Contexto específico del job (override en cada job)
     */
    protected function getJobContext(): array
    {
        return [];
    }
}
