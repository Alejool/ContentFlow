<?php

namespace App\Services\Calendar;

use App\Models\Publications\Publication;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Support\Facades\Log;

class OutlookCalendarProvider implements ExternalCalendarProvider
{
  private string $tenantId;
  private string $clientId;
  private string $clientSecret;
  private string $redirectUri;
  private ?string $accessToken = null;

  public function __construct()
  {
    $this->tenantId = config('services.outlook_calendar.tenant_id', 'common');
    $this->clientId = config('services.outlook_calendar.client_id');
    $this->clientSecret = config('services.outlook_calendar.client_secret');
    $this->redirectUri = config('services.outlook_calendar.redirect_uri');
  }

  /**
   * Get the OAuth2 authorization URL
   */
  public function getAuthUrl(?string $state = null): string
  {
    $params = [
      'client_id' => $this->clientId,
      'response_type' => 'code',
      'redirect_uri' => $this->redirectUri,
      'response_mode' => 'query',
      'scope' => 'openid profile email offline_access Calendars.ReadWrite User.Read',
    ];

    if ($state) {
      $params['state'] = $state;
    }

    return sprintf(
      'https://login.microsoftonline.com/%s/oauth2/v2.0/authorize?%s',
      $this->tenantId,
      http_build_query($params)
    );
  }

  /**
   * Authenticate with Microsoft using OAuth2 code
   */
  public function authenticate(string $code): array
  {
    try {
      $guzzle = new GuzzleClient();
      $url = sprintf(
        'https://login.microsoftonline.com/%s/oauth2/v2.0/token',
        $this->tenantId
      );

      $response = $guzzle->post($url, [
        'form_params' => [
          'client_id' => $this->clientId,
          'client_secret' => $this->clientSecret,
          'code' => $code,
          'redirect_uri' => $this->redirectUri,
          'grant_type' => 'authorization_code',
        ],
      ]);

      $tokenData = json_decode($response->getBody()->getContents(), true);

      if (!isset($tokenData['access_token'])) {
        throw new \Exception('No access token in response');
      }

      // Set access token for Graph API
      $this->setAccessToken($tokenData['access_token']);

      // Get user email
      $graphResponse = $guzzle->get('https://graph.microsoft.com/v1.0/me', [
        'headers' => [
          'Authorization' => 'Bearer ' . $tokenData['access_token'],
          'Accept' => 'application/json',
        ],
      ]);
      $userData = json_decode($graphResponse->getBody()->getContents(), true);

      return [
        'access_token' => $tokenData['access_token'],
        'refresh_token' => $tokenData['refresh_token'] ?? null,
        'expires_in' => $tokenData['expires_in'] ?? 3600,
        'email' => $userData['userPrincipalName'] ?? ($userData['mail'] ?? ''),
      ];
    } catch (\Exception $e) {
      Log::error('Outlook Calendar authentication failed', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString(),
      ]);
      throw $e;
    }
  }

  /**
   * Refresh the access token
   */
  public function refreshToken(string $refreshToken): array
  {
    try {
      $guzzle = new GuzzleClient();
      $url = sprintf(
        'https://login.microsoftonline.com/%s/oauth2/v2.0/token',
        $this->tenantId
      );

      $response = $guzzle->post($url, [
        'form_params' => [
          'client_id' => $this->clientId,
          'client_secret' => $this->clientSecret,
          'refresh_token' => $refreshToken,
          'grant_type' => 'refresh_token',
        ],
      ]);

      $tokenData = json_decode($response->getBody()->getContents(), true);

      return [
        'access_token' => $tokenData['access_token'],
        'expires_in' => $tokenData['expires_in'] ?? 3600,
      ];
    } catch (\Exception $e) {
      Log::error('Outlook Calendar token refresh failed', [
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Set access token for authenticated requests
   */
  public function setAccessToken(string $accessToken): void
  {
    $this->accessToken = $accessToken;
  }

  /**
   * Revoke the access token
   */
  public function revokeToken(): bool
  {
    try {
      // Microsoft doesn't have a direct revoke endpoint like Google
      // The token will expire naturally, but we can log the action
      Log::info('Outlook Calendar token marked for revocation (will expire naturally)');
      return true;
    } catch (\Exception $e) {
      Log::error('Failed to revoke Outlook Calendar token', [
        'error' => $e->getMessage(),
      ]);
      // Return true anyway - we'll delete locally
      return true;
    }
  }

  /**
   * Create an event in Outlook Calendar
   */
  public function createEvent(Publication $publication): string
  {
    try {
      $event = $this->buildEventFromPublication($publication);

      $guzzle = new GuzzleClient();
      $response = $guzzle->post('https://graph.microsoft.com/v1.0/me/calendar/events', [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->accessToken,
          'Content-Type' => 'application/json',
          'Accept' => 'application/json',
        ],
        'json' => $event,
      ]);

      $responseData = json_decode($response->getBody()->getContents(), true);
      $eventId = $responseData['id'];

      Log::info('Outlook Calendar event created', [
        'publication_id' => $publication->id,
        'event_id' => $eventId,
      ]);

      return $eventId;
    } catch (\Exception $e) {
      Log::error('Failed to create Outlook Calendar event', [
        'publication_id' => $publication->id,
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Update an existing event in Outlook Calendar
   */
  public function updateEvent(string $eventId, Publication $publication): bool
  {
    try {
      $event = $this->buildEventFromPublication($publication);

      $guzzle = new GuzzleClient();
      $guzzle->patch('https://graph.microsoft.com/v1.0/me/calendar/events/' . $eventId, [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->accessToken,
          'Content-Type' => 'application/json',
          'Accept' => 'application/json',
        ],
        'json' => $event,
      ]);

      Log::info('Outlook Calendar event updated', [
        'publication_id' => $publication->id,
        'event_id' => $eventId,
      ]);

      return true;
    } catch (\Exception $e) {
      Log::error('Failed to update Outlook Calendar event', [
        'publication_id' => $publication->id,
        'event_id' => $eventId,
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Delete an event from Outlook Calendar
   */
  public function deleteEvent(string $eventId): bool
  {
    try {
      $guzzle = new GuzzleClient();
      $guzzle->delete('https://graph.microsoft.com/v1.0/me/calendar/events/' . $eventId, [
        'headers' => [
          'Authorization' => 'Bearer ' . $this->accessToken,
        ],
      ]);

      Log::info('Outlook Calendar event deleted', [
        'event_id' => $eventId,
      ]);

      return true;
    } catch (\Exception $e) {
      Log::error('Failed to delete Outlook Calendar event', [
        'event_id' => $eventId,
        'error' => $e->getMessage(),
      ]);
      throw $e;
    }
  }

  /**
   * Build an Outlook Calendar Event from a Publication
   */
  private function buildEventFromPublication(Publication $publication): array
  {
    $scheduledAt = $publication->scheduled_at;

    // Build description with publication details
    $description = $this->buildEventDescription($publication);

    return [
      'subject' => $publication->title ?? 'Publicación programada',
      'body' => [
        'contentType' => 'text',
        'content' => $description,
      ],
      'start' => [
        'dateTime' => $scheduledAt->format('Y-m-d\TH:i:s'),
        'timeZone' => config('app.timezone'),
      ],
      'end' => [
        'dateTime' => $scheduledAt->copy()->addHour()->format('Y-m-d\TH:i:s'),
        'timeZone' => config('app.timezone'),
      ],
      'isReminderOn' => false,
    ];
  }

  /**
   * Build event description with publication details
   */
  private function buildEventDescription(Publication $publication): string
  {
    $lines = [];

    // Add content preview
    if ($publication->content) {
      $contentPreview = substr($publication->content, 0, 200);
      if (strlen($publication->content) > 200) {
        $contentPreview .= '...';
      }
      $lines[] = $contentPreview;
      $lines[] = '';
    }

    // Add platforms
    if ($publication->platforms && count($publication->platforms) > 0) {
      $platformNames = collect($publication->platforms)->pluck('name')->join(', ');
      $lines[] = '📱 Plataformas: ' . $platformNames;
    }

    // Add campaign
    if ($publication->campaign) {
      $lines[] = '📊 Campaña: ' . $publication->campaign->name;
    }

    // Add status
    $lines[] = '📌 Estado: ' . ucfirst($publication->status);

    // Add link to system
    $appUrl = config('app.url');
    $lines[] = '';
    $lines[] = '🔗 Ver en Intellipost: ' . $appUrl . '/content';

    return implode("\n", $lines);
  }
}
