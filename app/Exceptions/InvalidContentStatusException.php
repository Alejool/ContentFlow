<?php

namespace App\Exceptions;

use Exception;

class InvalidContentStatusException extends Exception
{
    public function __construct(string $message = "Content is not in a valid status for this operation.")
    {
        parent::__construct($message);
    }
}
