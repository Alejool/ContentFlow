<?php
require __DIR__ . '/../../../vendor/autoload.php';

try {
  $service = new \App\Services\SocialPlatforms\TwitterService();
  echo "TwitterService instantiated successfully.\n";
} catch (\Throwable $e) {
  echo "Error instantiating TwitterService: " . $e->getMessage() . "\n";
  // We expect an error here likely due to missing constructor args or config,
  // but if it parses, that's good.
}

// Check if methods exist
if (method_exists(\App\Services\SocialPlatforms\TwitterService::class, 'publishPost')) {
  echo "publishPost method exists.\n";
} else {
  echo "publishPost method MISSING.\n";
}

// Reflection to check private methods if needed, or just rely on parsing having succeeded
echo "Syntax check likely passed if this runs.\n";
