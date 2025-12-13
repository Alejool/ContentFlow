<?php

namespace App\Services\SocialMedia;

use Google_Client;
use Google_Service_YouTube;
use Google_Service_YouTube_Video;

class YouTubeService
{
  public function uploadVideo($videoPath, $data)
  {
    $client = new \Google_Client();
    $client->setAccessToken($this->accessToken);

    $youtube = new \Google_Service_YouTube($client);

    $video = new \Google_Service_YouTube_Video([
      'snippet' => [
        'title' => $data['title'],
        'description' => $data['description'],
        'tags' => $data['tags']
      ],
      'status' => [
        'privacyStatus' => 'public'
      ]
    ]);

    return $youtube->videos->insert('snippet,status', $video, [
      'data' => file_get_contents($videoPath),
      'mimeType' => 'video/*',
      'uploadType' => 'multipart'
    ]);
  }
}
