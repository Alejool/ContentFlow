<?php

namespace App\Listeners;

use App\Events\AuditableEvent;
use App\Models\AuditLog;

class AuditLogger
{
    public function handle(AuditableEvent $event): void
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $event->action,
            'auditable_type' => $event->auditable ? get_class($event->auditable) : null,
            'auditable_id' => $event->auditable?->id,
            'old_values' => $event->oldValues,
            'new_values' => $event->newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'metadata' => $event->metadata,
        ]);
    }
}
