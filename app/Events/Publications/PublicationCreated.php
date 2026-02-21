<?php

namespace App\Events\Publications;

use App\Models\Publications\Publication;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PublicationCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Publication $publication;

    /**
     * Create a new event instance.
     */
    public function __construct(Publication $publication)
    {
        $this->publication = $publication;
    }
}
