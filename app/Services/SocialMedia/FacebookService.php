<?php

namespace App\Services\SocialMedia;

use GuzzleHttp\Client;

class FacebookService
{
  protected $client;
  protected $accessToken;

  public function __construct($accessToken)
  {
    $this->client = new Client();
    $this->accessToken = $accessToken;
  }

  public function postToPage($pageId, $content, $image = null)
  {
    $url = "https://graph.facebook.com/v18.0/{$pageId}/feed";

    $data = [
      'message' => $content,
      'access_token' => $this->accessToken
    ];

    if ($image) {
      $data['url'] = $image;
    }

    $response = $this->client->post($url, ['form_params' => $data]);

    return json_decode($response->getBody(), true);
  }

  public function getInsights($pageId)
  {
    $url = "https://graph.facebook.com/v18.0/{$pageId}/insights";

    $response = $this->client->get($url, [
      'query' => [
        'access_token' => $this->accessToken,
        'metric' => 'page_impressions,page_engaged_users'
      ]
    ]);

    return json_decode($response->getBody(), true);
  }
}
