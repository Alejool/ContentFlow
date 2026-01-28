<?php

namespace App\Events;

use App\Models\SocialPostLog;

class SocialPostPublished
{
  public function __construct(public SocialPostLog $post, public array $results) {}
}
