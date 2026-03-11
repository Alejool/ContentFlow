<?php

namespace App\Exceptions;

use Exception;

class InvalidWorkflowConfigurationException extends Exception
{
    public function __construct(string $message = "Invalid approval workflow configuration.")
    {
        parent::__construct($message);
    }
}
