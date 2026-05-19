<?php

namespace App\Events\Social;

use App\Models\Social\SocialPostLog;

class SocialPostPublished
{
  public function __construct(public SocialPostLog $post, public array $results) {}
}
