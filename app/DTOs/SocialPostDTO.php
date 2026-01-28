<?php

namespace App\DTOs;

class SocialPostDTO
{
  public array $platformSettings;

  public function __construct(
    public string $content,
    public array $mediaPaths = [],
    public ?string $title = null,
    public array $hashtags = [],
    public array $metadata = [],
    mixed $platformSettings = []
  ) {
    if (is_string($platformSettings)) {
      $platformSettings = json_decode($platformSettings, true) ?? [];
    }
    $this->platformSettings = (array)$platformSettings;
  }

  public static function fromArray(array $data): self
  {
    $settings = $data['platform_settings'] ?? [];
    if (is_string($settings)) {
      $settings = json_decode($settings, true) ?? [];
    }

    return new self(
      content: $data['content'] ?? '',
      mediaPaths: $data['media_paths'] ?? $data['media_files'] ?? [],
      title: $data['title'] ?? null,
      hashtags: $data['hashtags'] ?? [],
      metadata: $data['metadata'] ?? [],
      platformSettings: (array)$settings
    );
  }
}
