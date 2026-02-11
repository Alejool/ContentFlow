<?php

namespace Tests\Feature;

use App\Models\Logs\WebhookLog;
use Tests\TestCase;

class WebhookLogTest extends TestCase
{
  public function test_can_instantiate_webhook_log()
  {
    $log = new WebhookLog();
    $this->assertInstanceOf(WebhookLog::class, $log);
  }
}
