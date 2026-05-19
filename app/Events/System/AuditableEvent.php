<?php

namespace App\Events\System;

use Illuminate\Database\Eloquent\Model;

abstract class AuditableEvent
{
    public function __construct(
        public string $action,
        public ?Model $auditable = null,
        public ?array $oldValues = null,
        public ?array $newValues = null,
        public ?array $metadata = null
    ) {}
}
