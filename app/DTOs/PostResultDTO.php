<?php

namespace App\DTOs;

class PostResultDTO
{
  public function __construct(
    public bool $success,
    public ?string $postId = null,
    public ?string $postUrl = null,
    public ?string $errorMessage = null,
    public array $rawData = []
  ) {}

  public static function success(string $postId, ?string $postUrl = null, array $rawData = []): self
  {
    return new self(
      success: true,
      postId: $postId,
      postUrl: $postUrl,
      rawData: $rawData
    );
  }

  public static function failure(string $errorMessage, array $rawData = []): self
  {
    return new self(
      success: false,
      errorMessage: $errorMessage,
      rawData: $rawData
    );
  }
}
