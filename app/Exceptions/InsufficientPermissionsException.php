<?php

namespace App\Exceptions;

use Exception;

class InsufficientPermissionsException extends Exception
{
    public function __construct(string $message = "Insufficient permissions to perform this action.")
    {
        parent::__construct($message);
    }
}
