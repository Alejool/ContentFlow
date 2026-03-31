<?php

namespace App\Jobs\Subscription;

use App\Models\Workspace\Workspace;
use App\Services\Subscription\RenewalService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessRenewalRetryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $queue = 'publishing';

    public $tries = 1;

    public function __construct(
        public readonly Workspace $workspace,
        public readonly int $retryCount,
    ) {}

    public function handle(RenewalService $renewalService): void
    {
        Log::info('ProcessRenewalRetryJob: attempting renewal retry', [
            'workspace_id' => $this->workspace->id,
            'retry_count' => $this->retryCount,
        ]);

        $result = $renewalService->attemptRenewal($this->workspace);

        if (! $result->success) {
            Log::warning('ProcessRenewalRetryJob: renewal retry failed', [
                'workspace_id' => $this->workspace->id,
                'retry_count' => $this->retryCount,
                'error' => $result->errorMessage,
            ]);

            $renewalService->handleFailedRenewal($this->workspace, $this->retryCount);
        } else {
            Log::info('ProcessRenewalRetryJob: renewal retry succeeded', [
                'workspace_id' => $this->workspace->id,
                'retry_count' => $this->retryCount,
                'gateway' => $result->gateway,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessRenewalRetryJob: job failed permanently', [
            'workspace_id' => $this->workspace->id,
            'retry_count' => $this->retryCount,
            'error' => $exception->getMessage(),
        ]);
    }
}
