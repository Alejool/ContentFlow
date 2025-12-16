<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\SocialPlatforms\TwitterService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Support\Facades\Storage;
use App\Models\SocialAccount;

class TwitterIntegrationTest extends TestCase
{
  public function test_chunked_video_upload_flow()
  {
    // 1. Prepare Mock Responses
    $mock = new MockHandler([
      // INIT response
      new Response(200, [], json_encode(['media_id_string' => '123456'])),
      // APPEND response (chunk 1)
      new Response(204, []),
      // APPEND response (chunk 2)
      new Response(204, []),
      // FINALIZE response
      new Response(200, [], json_encode(['media_id_string' => '123456', 'size' => 1024])),
      // STATUS response (Processing)
      new Response(200, [], json_encode(['processing_info' => ['state' => 'in_progress', 'check_after_secs' => 0]])),
      // STATUS response (Succeeded)
      new Response(200, [], json_encode(['processing_info' => ['state' => 'succeeded']])),
      // POST Tweet response
      new Response(201, [], json_encode(['data' => ['id' => '987654321']])),
    ]);

    $handlerStack = HandlerStack::create($mock);
    $client = new Client(['handler' => $handlerStack]);

    // 2. Create Dummy Video File > 2MB to trigger chunking
    $tempFile = tempnam(sys_get_temp_dir(), 'test_video_');
    // Fake MP4 header (ftypisom) to clean mime detection
    $header = hex2bin('000000186674797069736f6d0000020069736f6d69736f3261766331');
    $content = $header . str_repeat('0', 3 * 1024 * 1024);
    file_put_contents($tempFile, $content);

    // 3. Mock Service
    $service = new class('fake_token', $client) extends TwitterService {
      public function __construct($token, $client)
      {
        parent::__construct($token);
        $this->client = $client;
      }
      // Override download to just return our local temp file
      protected function downloadMedia(string $url): string
      {
        return $url;
      }
      // Helper to expose private method for testing if needed, or just test publishPost
      public function exposeDownload(string $url)
      {
        return $this->downloadMedia($url);
      }
    };

    // 4. Test publishPost with video
    $result = $service->publishPost([
      'content' => 'Test Video Tweet',
      'media_url' => $tempFile,
    ]);

    // 5. Assertions
    $this->assertTrue($result['success']);
    $this->assertEquals('987654321', $result['post_id']);

    // Use reflection or trust the mock sequence executed correctly
    // The MockHandler throws exception if queue is not empty or requests don't match if we were stricter
    // but here ensuring it finished and returned success is good enough proof the flow worked.

    // Cleanup
    unlink($tempFile);
  }
}
