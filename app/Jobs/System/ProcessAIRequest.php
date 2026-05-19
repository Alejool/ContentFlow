<?php

namespace App\Jobs\System;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Broadcast;
use App\Services\AI\AIService;

class ProcessAIRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public $context;
    public $userId;
    public function handle(AIService $aiService)
    {
        $response = $aiService->chat($this->context);

        Broadcast::channel('ai-chat.' . $this->userId)
            ->push('response.ready', $response);
    }
}
