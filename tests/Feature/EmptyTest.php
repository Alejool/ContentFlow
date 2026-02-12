<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmptyTest extends TestCase
{
  use RefreshDatabase;
  public function test_true()
  {
    $this->assertTrue(true);
  }
}
