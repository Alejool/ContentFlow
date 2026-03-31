<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Social\SocialAccount;
use App\Services\SocialPlatforms\PlatformCapabilitiesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SocialAccountCapabilitiesController extends Controller
{
    public function __construct(
        private PlatformCapabilitiesService $capabilitiesService
    ) {}

    /**
     * Get capabilities for a specific account
     */
    public function show(SocialAccount $account): JsonResponse
    {
        $this->authorize('view', $account);

        $capabilities = $this->capabilitiesService->getAccountCapabilities($account);

        return response()->json([
            'account_id' => $account->id,
            'platform' => $account->platform,
            'account_name' => $account->account_name,
            'capabilities' => $capabilities,
        ]);
    }

    /**
     * Refresh capabilities for a specific account
     */
    public function refresh(SocialAccount $account): JsonResponse
    {
        $this->authorize('update', $account);

        try {
            $capabilities = $this->capabilitiesService->updateAccountCapabilities($account);

            return response()->json([
                'success' => true,
                'message' => 'Capabilities updated successfully',
                'account_id' => $account->id,
                'capabilities' => $capabilities,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update capabilities: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate video for multiple accounts
     */
    public function validateVideo(Request $request): JsonResponse
    {
        $request->validate([
            'account_ids' => 'required|array',
            'account_ids.*' => 'exists:social_accounts,id',
            'video_duration' => 'required|integer|min:1',
            'file_size_mb' => 'required|numeric|min:0',
        ]);

        $accounts = SocialAccount::whereIn('id', $request->account_ids)
            ->where('workspace_id', auth()->user()->current_workspace_id)
            ->get();

        $results = [];

        foreach ($accounts as $account) {
            $validation = $this->capabilitiesService->validateVideoForAccount(
                $account,
                $request->video_duration,
                $request->file_size_mb
            );

            $results[] = [
                'account_id' => $account->id,
                'platform' => $account->platform,
                'account_name' => $account->account_name,
                'valid' => $validation['valid'],
                'errors' => $validation['errors'],
                'warnings' => $validation['warnings'],
                'capabilities' => $validation['capabilities'],
            ];
        }

        $allValid = collect($results)->every(fn($r) => $r['valid']);

        return response()->json([
            'valid' => $allValid,
            'results' => $results,
        ]);
    }

    /**
     * Get capabilities for all accounts in workspace
     */
    public function index(Request $request): JsonResponse
    {
        $accounts = SocialAccount::where('workspace_id', auth()->user()->current_workspace_id)
            ->where('is_active', true)
            ->get();

        $results = $accounts->map(function ($account) {
            $capabilities = $this->capabilitiesService->getAccountCapabilities($account);
            
            return [
                'account_id' => $account->id,
                'platform' => $account->platform,
                'account_name' => $account->account_name,
                'capabilities' => $capabilities,
            ];
        });

        return response()->json([
            'accounts' => $results,
        ]);
    }
}
