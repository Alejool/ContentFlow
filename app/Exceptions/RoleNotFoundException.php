<?php

namespace App\Exceptions;

use Exception;

class RoleNotFoundException extends Exception
{
    public function __construct(string $roleName)
    {
        parent::__construct("Role '{$roleName}' not found.");
    }
}
