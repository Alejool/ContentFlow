<?php

class SocialPostPublished
{
  public function __construct(public SocialPost $post, public array $results) {}
}
