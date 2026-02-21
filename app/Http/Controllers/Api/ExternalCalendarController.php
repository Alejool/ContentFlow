<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Calendar\ExternalCalendarConnection;
use App\Services\Calendar\ExternalCalendarSyncService;
use App\Services\Calendar\GoogleCalendarProvider;
use App\Services\Calendar\OutlookCalendarProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExternalCalendarController extends Controller
{
    /**
     * Initiate OAuth2 connection with external calendar provider
     */
    public function connect(Request $request, string $provider): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

            if (!in_array($provider, ['google', 'outlook'])) {
                return response()->json([
                    'error' => 'Invalid provider. Supported providers: google, outlook'
                ], 400);
            }

            // Create state with user info
            $state = base64_encode(json_encode([
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'provider' => $provider,
                'timestamp' => time(),
            ]));

            // Get authorization URL based on provider with state
            $providerInstance = $this->getProviderInstance($provider);
            $authUrl = $providerInstance->getAuthUrl($state);
            
            Log::info('Generated auth URL', [
                'provider' => $provider,
                'auth_url' => $authUrl,
                'state' => $state,
            ]);

            return response()->json([
                'auth_url' => $authUrl,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to initiate external calendar connection', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to initiate connection: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle Google Calendar OAuth callback
     */
    public function handleGoogleCalendarCallback(Request $request)
    {
        // Log all incoming parameters for debugging
        Log::info('Google Calendar callback received', [
            'all_params' => $request->all(),
            'has_code' => $request->has('code'),
            'has_state' => $request->has('state'),
        ]);

        if (!$request->has('code')) {
            return $this->handleOAuthError('Authorization code not received');
        }

        // Get and validate state
        $state = $request->input('state');
        if (!$state) {
            return $this->handleOAuthError('Missing state parameter');
        }

        // Decode state
        try {
            $stateData = json_decode(base64_decode($state), true);
        } catch (\Exception $e) {
            return $this->handleOAuthError('Invalid state format');
        }

        // Validate state data
        if (!isset($stateData['user_id'], $stateData['workspace_id'], $stateData['provider'], $stateData['timestamp'])) {
            return $this->handleOAuthError('Invalid state data');
        }

        // Check if state is not too old (10 minutes max)
        if (time() - $stateData['timestamp'] > 600) {
            return $this->handleOAuthError('Authentication session expired. Please try again.');
        }

        // Verify provider matches
        if ($stateData['provider'] !== 'google') {
            return $this->handleOAuthError('Provider mismatch');
        }

        try {
            // Exchange code for tokens
            $providerInstance = $this->getProviderInstance('google');
            $tokenData = $providerInstance->authenticate($request->code);

            // Check if this is a reconnection
            $isReconnection = ExternalCalendarConnection::where('user_id', $stateData['user_id'])
                ->where('workspace_id', $stateData['workspace_id'])
                ->where('provider', 'google')
                ->exists();

            // Save connection to database
            $connection = DB::transaction(function () use ($stateData, $tokenData) {
                return ExternalCalendarConnection::updateOrCreate(
                    [
                        'user_id' => $stateData['user_id'],
                        'workspace_id' => $stateData['workspace_id'],
                        'provider' => 'google',
                    ],
                    [
                        'email' => $tokenData['email'],
                        'access_token' => encrypt($tokenData['access_token']),
                        'refresh_token' => $tokenData['refresh_token'] ? encrypt($tokenData['refresh_token']) : null,
                        'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                        'sync_enabled' => true,
                        'status' => 'connected',
                        'error_message' => null,
                    ]
                );
            });

            // Trigger full sync if reconnecting
            if ($isReconnection) {
                try {
                    $syncService = app(ExternalCalendarSyncService::class);
                    $syncService->fullSync($connection);
                } catch (\Exception $e) {
                    Log::error('Full sync failed after reconnection', [
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('External calendar connected successfully', [
                'user_id' => $stateData['user_id'],
                'workspace_id' => $stateData['workspace_id'],
                'provider' => 'google',
                'email' => $tokenData['email'],
            ]);

            return $this->closeWindowWithMessage('success', [
                'provider' => 'google',
                'email' => $tokenData['email'],
            ]);
        } catch (\Exception $e) {
            Log::error('External calendar callback failed', [
                'provider' => 'google',
                'error' => $e->getMessage(),
            ]);
            return $this->handleOAuthError('Error connecting calendar: ' . $e->getMessage());
        }
    }

    /**
     * Handle Outlook Calendar OAuth callback
     */
    public function handleOutlookCalendarCallback(Request $request)
    {
        if (!$request->has('code')) {
            return $this->handleOAuthError('Authorization code not received');
        }

        // Get and validate state
        $state = $request->input('state');
        if (!$state) {
            return $this->handleOAuthError('Missing state parameter');
        }

        // Decode state
        try {
            $stateData = json_decode(base64_decode($state), true);
        } catch (\Exception $e) {
            return $this->handleOAuthError('Invalid state format');
        }

        // Validate state data
        if (!isset($stateData['user_id'], $stateData['workspace_id'], $stateData['provider'], $stateData['timestamp'])) {
            return $this->handleOAuthError('Invalid state data');
        }

        // Check if state is not too old (10 minutes max)
        if (time() - $stateData['timestamp'] > 600) {
            return $this->handleOAuthError('Authentication session expired. Please try again.');
        }

        // Verify provider matches
        if ($stateData['provider'] !== 'outlook') {
            return $this->handleOAuthError('Provider mismatch');
        }

        try {
            // Exchange code for tokens
            $providerInstance = $this->getProviderInstance('outlook');
            $tokenData = $providerInstance->authenticate($request->code);

            // Check if this is a reconnection
            $isReconnection = ExternalCalendarConnection::where('user_id', $stateData['user_id'])
                ->where('workspace_id', $stateData['workspace_id'])
                ->where('provider', 'outlook')
                ->exists();

            // Save connection to database
            $connection = DB::transaction(function () use ($stateData, $tokenData) {
                return ExternalCalendarConnection::updateOrCreate(
                    [
                        'user_id' => $stateData['user_id'],
                        'workspace_id' => $stateData['workspace_id'],
                        'provider' => 'outlook',
                    ],
                    [
                        'email' => $tokenData['email'],
                        'access_token' => encrypt($tokenData['access_token']),
                        'refresh_token' => $tokenData['refresh_token'] ? encrypt($tokenData['refresh_token']) : null,
                        'token_expires_at' => now()->addSeconds($tokenData['expires_in']),
                        'sync_enabled' => true,
                        'status' => 'connected',
                        'error_message' => null,
                    ]
                );
            });

            // Trigger full sync if reconnecting
            if ($isReconnection) {
                try {
                    $syncService = app(ExternalCalendarSyncService::class);
                    $syncService->fullSync($connection);
                } catch (\Exception $e) {
                    Log::error('Full sync failed after reconnection', [
                        'connection_id' => $connection->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('External calendar connected successfully', [
                'user_id' => $stateData['user_id'],
                'workspace_id' => $stateData['workspace_id'],
                'provider' => 'outlook',
                'email' => $tokenData['email'],
            ]);

            return $this->closeWindowWithMessage('success', [
                'provider' => 'outlook',
                'email' => $tokenData['email'],
            ]);
        } catch (\Exception $e) {
            Log::error('External calendar callback failed', [
                'provider' => 'outlook',
                'error' => $e->getMessage(),
            ]);
            return $this->handleOAuthError('Error connecting calendar: ' . $e->getMessage());
        }
    }

    /**
     * Close window with success/error message
     */
    private function closeWindowWithMessage($status, $data = [])
    {
        return view('oauth.callback', [
            'success' => $status === 'success',
            'data' => json_encode($data)
        ]);
    }

    /**
     * Handle OAuth error
     */
    private function handleOAuthError($message, $errorType = 'unknown')
    {
        return view('oauth.callback', [
            'success' => false,
            'message' => $message,
            'errorType' => $errorType,
        ]);
    }

    /**
     * Disconnect external calendar
     */
    public function disconnect(Request $request, string $provider): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

            $connection = ExternalCalendarConnection::where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->where('provider', $provider)
                ->first();

            if (!$connection) {
                return response()->json([
                    'error' => 'Connection not found'
                ], 404);
            }

            // Revoke access token with provider
            try {
                $providerInstance = $this->getProviderInstance($provider);
                $providerInstance->setAccessToken(decrypt($connection->access_token));
                $providerInstance->revokeToken();
            } catch (\Exception $e) {
                // Log but don't fail - we'll delete locally anyway
                Log::warning('Failed to revoke token with provider', [
                    'provider' => $provider,
                    'error' => $e->getMessage(),
                ]);
            }

            // Delete all synced events
            $connection->events()->delete();

            // Delete connection
            $connection->delete();

            Log::info('External calendar disconnected', [
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'provider' => $provider,
            ]);

            return response()->json([
                'message' => 'Calendar disconnected successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to disconnect external calendar', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to disconnect: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get status of all external calendar connections
     */
    public function status(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

            $connections = ExternalCalendarConnection::where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->get()
                ->map(function ($connection) {
                    return [
                        'provider' => $connection->provider,
                        'connected' => true,
                        'email' => $connection->email,
                        'lastSync' => $connection->last_sync_at?->toIso8601String(),
                        'status' => $connection->status,
                        'errorMessage' => $connection->error_message,
                        'syncEnabled' => $connection->sync_enabled,
                        'syncConfig' => $connection->sync_config ?? [
                            'syncCampaigns' => [],
                            'syncPlatforms' => [],
                        ],
                    ];
                });

            // Add disconnected providers
            $connectedProviders = $connections->pluck('provider')->toArray();
            $allProviders = ['google', 'outlook'];

            foreach ($allProviders as $provider) {
                if (!in_array($provider, $connectedProviders)) {
                    $connections->push([
                        'provider' => $provider,
                        'connected' => false,
                        'email' => null,
                        'lastSync' => null,
                        'status' => 'disconnected',
                        'errorMessage' => null,
                        'syncEnabled' => false,
                        'syncConfig' => null,
                    ]);
                }
            }

            return response()->json([
                'connections' => $connections->values()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get external calendar status', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to get status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Configure sync settings for a provider
     */
    public function configureSyncSettings(Request $request, string $provider): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

            $validated = $request->validate([
                'sync_enabled' => 'boolean',
                'sync_campaigns' => 'array',
                'sync_campaigns.*' => 'integer|exists:campaigns,id',
                'sync_platforms' => 'array',
                'sync_platforms.*' => 'string',
            ]);

            $connection = ExternalCalendarConnection::where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->where('provider', $provider)
                ->firstOrFail();

            $connection->update([
                'sync_enabled' => $validated['sync_enabled'] ?? $connection->sync_enabled,
                'sync_config' => [
                    'sync_campaigns' => $validated['sync_campaigns'] ?? [],
                    'sync_platforms' => $validated['sync_platforms'] ?? [],
                ],
            ]);

            Log::info('External calendar sync settings updated', [
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'provider' => $provider,
            ]);

            return response()->json([
                'message' => 'Sync settings updated successfully',
                'connection' => [
                    'provider' => $connection->provider,
                    'sync_enabled' => $connection->sync_enabled,
                    'sync_config' => $connection->sync_config,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to configure sync settings', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to configure sync settings: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trigger a full sync for a provider
     */
    public function triggerFullSync(Request $request, string $provider): JsonResponse
    {
        try {
            $user = Auth::user();
            $workspaceId = $request->input('workspace_id', $user->current_workspace_id);

            $connection = ExternalCalendarConnection::where('user_id', $user->id)
                ->where('workspace_id', $workspaceId)
                ->where('provider', $provider)
                ->where('status', 'connected')
                ->firstOrFail();

            $syncService = app(ExternalCalendarSyncService::class);
            $results = $syncService->fullSync($connection);

            Log::info('Manual full sync completed', [
                'user_id' => $user->id,
                'workspace_id' => $workspaceId,
                'provider' => $provider,
                'results' => $results,
            ]);

            return response()->json([
                'message' => 'Full sync completed',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to trigger full sync', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to trigger full sync: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authorization URL for provider
     */
    private function getAuthUrl(string $provider): string
    {
        $providerInstance = $this->getProviderInstance($provider);
        return $providerInstance->getAuthUrl();
    }

    /**
     * Get provider instance
     */
    private function getProviderInstance(string $provider): GoogleCalendarProvider|OutlookCalendarProvider
    {
        return match ($provider) {
            'google' => new GoogleCalendarProvider(),
            'outlook' => new OutlookCalendarProvider(),
            default => throw new \InvalidArgumentException('Unsupported provider: ' . $provider),
        };
    }
}
