<?php

namespace App\Integrations\Contracts;

use App\Models\IntegrationConnection;
use Illuminate\Http\RedirectResponse;

interface OAuthIntegrationInterface extends IntegrationInterface
{
    /**
     * Get the OAuth authorization URL
     */
    public function getAuthorizationUrl(array $scopes = []): string;

    /**
     * Handle the OAuth callback
     */
    public function handleCallback(string $code, string $state): IntegrationConnection;

    /**
     * Refresh the access token
     */
    public function refreshToken(IntegrationConnection $connection): IntegrationConnection;

    /**
     * Revoke the access token
     */
    public function revokeToken(IntegrationConnection $connection): bool;

    /**
     * Get required OAuth scopes
     */
    public function getRequiredScopes(): array;
}
