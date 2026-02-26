<?php

namespace App\Services\Calendar;

use App\Models\Publications\Publication;
use Illuminate\Support\Facades\Log;
use Google\Client as Google_Client;
use Google\Service\Calendar as Google_Service_Calendar;
use Google\Service\Calendar\Event as Google_Service_Calendar_Event;
use Google\Service\Calendar\EventDateTime as Google_Service_Calendar_EventDateTime;
use Google\Service\Oauth2 as Google_Service_Oauth2;

class GoogleCalendarProvider implements ExternalCalendarProvider
{
    private ?Google_Service_Calendar $service = null;
    private string $calendarId = 'primary';

    /**
     * Get the OAuth2 authorization URL
     */
    public function getAuthUrl(string $state = null): string
    {
        $client = $this->getGoogleClient();
        
        if ($state) {
            $client->setState($state);
        }
        
        return $client->createAuthUrl();
    }

    /**
     * Authenticate with Google using OAuth2 code
     */
    public function authenticate(string $code): array
    {
        try {
            $client = $this->getGoogleClient();
            $token = $client->fetchAccessTokenWithAuthCode($code);

            if (isset($token['error'])) {
                throw new \Exception('Error fetching access token: ' . $token['error']);
            }

            $client->setAccessToken($token);

            // Get user email
            $oauth2 = new Google_Service_Oauth2($client);
            $userInfo = $oauth2->userinfo->get();

            return [
                'access_token' => $token['access_token'],
                'refresh_token' => $token['refresh_token'] ?? null,
                'expires_in' => $token['expires_in'] ?? 3600,
                'email' => $userInfo->email,
            ];
        } catch (\Exception $e) {
            Log::error('Google Calendar authentication failed', [
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
            $client = $this->getGoogleClient();
            $client->refreshToken($refreshToken);
            $token = $client->getAccessToken();

            return [
                'access_token' => $token['access_token'],
                'expires_in' => $token['expires_in'] ?? 3600,
            ];
        } catch (\Exception $e) {
            Log::error('Google Calendar token refresh failed', [
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
        $client = $this->getGoogleClient();
        $client->setAccessToken($accessToken);
        $this->service = new Google_Service_Calendar($client);
    }

    /**
     * Revoke the access token
     */
    public function revokeToken(): bool
    {
        try {
            $client = $this->getGoogleClient();
            $token = $client->getAccessToken();
            if (isset($token['access_token'])) {
                $client->revokeToken($token['access_token']);
                Log::info('Google Calendar token revoked successfully');
                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error('Failed to revoke Google Calendar token', [
                'error' => $e->getMessage(),
            ]);
            // Return true anyway - we'll delete locally
            return true;
        }
    }

    /**
     * Get or create Google Client instance
     */
    private function getGoogleClient(): Google_Client
    {
        $client = new Google_Client();
        $client->setClientId(config('services.google_calendar.client_id'));
        $client->setClientSecret(config('services.google_calendar.client_secret'));
        $client->setRedirectUri(config('services.google_calendar.redirect_uri'));
        
        // Add Calendar and email scopes
        $client->addScope(Google_Service_Calendar::CALENDAR_EVENTS);
        $client->addScope('https://www.googleapis.com/auth/userinfo.email');
        
        // Request offline access to get refresh token
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        
        return $client;
    }

    /**
     * Create an event in Google Calendar
     */
    public function createEvent(Publication $publication): string
    {
        try {
            if (!$this->service) {
                throw new \Exception('Google Calendar service not initialized. Call setAccessToken first.');
            }

            $event = $this->buildEventFromPublication($publication);
            $createdEvent = $this->service->events->insert($this->calendarId, $event);

            Log::info('Google Calendar event created', [
                'publication_id' => $publication->id,
                'event_id' => $createdEvent->getId(),
            ]);

            return $createdEvent->getId();
        } catch (\Exception $e) {
            Log::error('Failed to create Google Calendar event', [
                'publication_id' => $publication->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Update an existing event in Google Calendar
     */
    public function updateEvent(string $eventId, Publication $publication): bool
    {
        try {
            if (!$this->service) {
                throw new \Exception('Google Calendar service not initialized. Call setAccessToken first.');
            }

            $event = $this->buildEventFromPublication($publication);
            $this->service->events->update($this->calendarId, $eventId, $event);

            Log::info('Google Calendar event updated', [
                'publication_id' => $publication->id,
                'event_id' => $eventId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to update Google Calendar event', [
                'publication_id' => $publication->id,
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Delete an event from Google Calendar
     */
    public function deleteEvent(string $eventId): bool
    {
        try {
            if (!$this->service) {
                throw new \Exception('Google Calendar service not initialized. Call setAccessToken first.');
            }

            $this->service->events->delete($this->calendarId, $eventId);

            Log::info('Google Calendar event deleted', [
                'event_id' => $eventId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete Google Calendar event', [
                'event_id' => $eventId,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Build a Google Calendar Event from a Publication
     */
    private function buildEventFromPublication(Publication $publication): Google_Service_Calendar_Event
    {
        $event = new Google_Service_Calendar_Event();

        // Set title
        $event->setSummary($publication->title ?? 'Publicación programada');

        // Build description with publication details
        $description = $this->buildEventDescription($publication);
        $event->setDescription($description);

        // Set start and end time
        $scheduledAt = $publication->scheduled_at;
        $start = new Google_Service_Calendar_EventDateTime();
        $start->setDateTime($scheduledAt->toRfc3339String());
        $start->setTimeZone(config('app.timezone'));
        $event->setStart($start);

        // End time is 1 hour after start
        $end = new Google_Service_Calendar_EventDateTime();
        $end->setDateTime($scheduledAt->addHour()->toRfc3339String());
        $end->setTimeZone(config('app.timezone'));
        $event->setEnd($end);

        // Set color (optional)
        $event->setColorId('9'); // Blue color

        return $event;
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
        $lines[] = '🔗 Ver en Contenflow: ' . $appUrl . '/content';

        return implode("\n", $lines);
    }
}
