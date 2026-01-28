<?php

namespace App\Events;

use App\Models\SocialAccount;

class TokenExpired
{
  public function __construct(public SocialAccount $account) {}
}
