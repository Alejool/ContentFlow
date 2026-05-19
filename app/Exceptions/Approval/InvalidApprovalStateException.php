<?php

namespace App\Exceptions\Approval;

use Exception;

class InvalidApprovalStateException extends Exception
{
    public function __construct(string $message = "Content is not in a valid approval state for this operation.")
    {
        parent::__construct($message);
    }
}
