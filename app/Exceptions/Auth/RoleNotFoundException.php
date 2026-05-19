<?php

namespace App\Exceptions\Auth;

use Exception;

class RoleNotFoundException extends Exception
{
    public function __construct(string $roleName)
    {
        parent::__construct("Role '{$roleName}' not found.");
    }
}
