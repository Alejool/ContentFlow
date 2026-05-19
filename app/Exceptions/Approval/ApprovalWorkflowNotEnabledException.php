<?php

namespace App\Exceptions\Approval;

use Exception;

class ApprovalWorkflowNotEnabledException extends Exception
{
    public function __construct(string $message = "Approval workflow is not enabled for this workspace.")
    {
        parent::__construct($message);
    }
}
