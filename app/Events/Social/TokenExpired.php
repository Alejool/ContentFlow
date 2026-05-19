<?php

namespace App\Events\Social;

use App\Models\Social\SocialAccount;

class TokenExpired
{
  public function __construct(public SocialAccount $account) {}
}
