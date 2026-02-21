<?php

namespace App\Services\Calendar;

use App\Models\Publications\Publication;

interface ExternalCalendarProvider
{
    /**
     * Authenticate with the external calendar provider using OAuth2 code
     *
     * @param string $code OAuth2 authorization code
     * @return array Array containing access_token, refresh_token, expires_in, and email
     */
    public function authenticate(string $code): array;

    /**
     * Get the OAuth2 authorization URL
     *
     * @param string|null $state Optional state parameter for CSRF protection
     * @return string Authorization URL
     */
    public function getAuthUrl(string $state = null): string;

    /**
     * Create an event in the external calendar
     *
     * @param Publication $publication Publication to sync
     * @return string External event ID
     */
    public function createEvent(Publication $publication): string;

    /**
     * Update an existing event in the external calendar
     *
     * @param string $eventId External event ID
     * @param Publication $publication Updated publication data
     * @return bool Success status
     */
    public function updateEvent(string $eventId, Publication $publication): bool;

    /**
     * Delete an event from the external calendar
     *
     * @param string $eventId External event ID
     * @return bool Success status
     */
    public function deleteEvent(string $eventId): bool;

    /**
     * Refresh the access token using refresh token
     *
     * @param string $refreshToken Refresh token
     * @return array Array containing new access_token and expires_in
     */
    public function refreshToken(string $refreshToken): array;

    /**
     * Set the access token for API calls
     *
     * @param string $accessToken Access token
     * @return void
     */
    public function setAccessToken(string $accessToken): void;

    /**
     * Revoke the access token
     *
     * @return bool Success status
     */
    public function revokeToken(): bool;
}
