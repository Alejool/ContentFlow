<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Broadcasting\Broadcast;

class ProcessAIRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public function handle(AIService $aiService)
    {
        $response = $aiService->chat($this->context);

        // Notificar al usuario en tiempo real
        Broadcast::channel('ai-chat.' . $this->userId)
            ->push('response.ready', $response);
    }
}