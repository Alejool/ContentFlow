<?php

namespace App\Services\SocialPlatforms;

class FacebookService extends BaseSocialService
{
  public function publishPost(array $data): array
  {
    // Determinar si es página o perfil
    $endpoint = $this->getPublishEndpoint($data['account_type']);

    $formData = [
      'message' => $data['content'],
      'access_token' => $this->accessToken,
    ];

    if (!empty($data['media_url'])) {
      $formData['url'] = $data['media_url'];
    }

    if (!empty($data['link'])) {
      $formData['link'] = $data['link'];
    }

    $response = $this->client->post($endpoint, [
      'form_params' => $formData,
    ]);

    $result = json_decode($response->getBody(), true);

    return [
      'success' => true,
      'post_id' => $result['id'],
      'platform' => 'facebook',
      'url' => "https://facebook.com/{$result['id']}",
    ];
  }

  public function getAccountInfo(): array
  {
    $response = $this->client->get('https://graph.facebook.com/v18.0/me', [
      'query' => [
        'access_token' => $this->accessToken,
        'fields' => 'id,name,email,picture,accounts{id,name,access_token}',
      ]
    ]);

    return json_decode($response->getBody(), true);
  }

  public function getPostAnalytics(string $postId): array
  {
    $response = $this->client->get("https://graph.facebook.com/v18.0/{$postId}/insights", [
      'query' => [
        'access_token' => $this->accessToken,
        'metric' => 'post_impressions,post_engaged_users,post_reactions_by_type_total',
        'period' => 'lifetime',
      ]
    ]);

    return $this->formatAnalytics(json_decode($response->getBody(), true));
  }

  public function validateCredentials(): bool
  {
    try {
      $this->client->get('https://graph.facebook.com/v18.0/me', [
        'query' => ['access_token' => $this->accessToken]
      ]);
      return true;
    } catch (\Exception $e) {
      return false;
    }
  }
}
