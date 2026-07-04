<?php

namespace App\Http\Controllers\Integrations;

use App\Constants\IntegrationEvents;
use App\Http\Controllers\Controller;
use App\Http\Requests\Integrations\StoreIntegrationSubscriptionRequest;
use App\Http\Requests\Integrations\UpdateIntegrationSubscriptionRequest;
use App\Models\Integrations\IntegrationEventSubscription;
use App\Models\Workspace\Workspace;
use App\Repositories\IntegrationSubscriptionRepository;
use App\Services\Integrations\IntegrationEventDispatcher;
use App\Traits\System\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IntegrationSubscriptionController extends Controller
{
    use ApiResponse;

    public function __construct(private IntegrationSubscriptionRepository $repo)
    {
    }

    /** GET /api/v1/workspaces/{ws}/integrations/subscriptions */
    public function index(string $idOrSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);

        return $this->successResponse([
            'subscriptions'     => $this->repo->groupedForWorkspace($workspace->id),
            'supported_channels' => IntegrationEventSubscription::supportedChannels(),
            'event_definitions'  => IntegrationEvents::groups(),
        ]);
    }

    /** POST /api/v1/workspaces/{ws}/integrations/subscriptions */
    public function store(StoreIntegrationSubscriptionRequest $request, string $idOrSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $subscription = $this->repo->create($workspace->id, $request->validated());

        return $this->successResponse(['subscription' => $subscription], 'Subscription created.', 201);
    }

    /** PUT /api/v1/workspaces/{ws}/integrations/subscriptions/{id} */
    public function update(UpdateIntegrationSubscriptionRequest $request, string $idOrSlug, int $id): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $subscription = $this->repo->findForWorkspace($workspace->id, $id);
        $subscription->update($request->validated());

        return $this->successResponse(['subscription' => $subscription], 'Subscription updated.');
    }

    /** DELETE /api/v1/workspaces/{ws}/integrations/subscriptions/{id} */
    public function destroy(string $idOrSlug, int $id): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $this->repo->findForWorkspace($workspace->id, $id)->delete();

        return $this->successResponse(null, 'Subscription deleted.');
    }

    /** POST /api/v1/workspaces/{ws}/integrations/subscriptions/{id}/test */
    public function test(string $idOrSlug, int $id): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $subscription = $this->repo->findForWorkspace($workspace->id, $id);

        try {
            IntegrationEventDispatcher::dispatch(
                workspaceId: $workspace->id,
                eventType:   $subscription->event_type,
                payload:     ['message' => 'This is a test notification from Intellipost.', 'is_test' => true],
            );

            return $this->successResponse(null, 'Test notification sent.');
        } catch (\Throwable $e) {
            return $this->errorResponse('Test failed: ' . $e->getMessage(), 500);
        }
    }

    /** GET /api/v1/workspaces/{ws}/integrations/logs */
    public function logs(Request $request, string $idOrSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $logs = $this->repo->deliveryLogs($workspace->id, $request->integer('per_page', 20));

        return $this->successResponse(['logs' => $logs]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Resolve the workspace and assert the caller is an owner/admin. */
    private function resolveWorkspace(string $idOrSlug): Workspace
    {
        $workspace = $this->repo->resolveWorkspace($idOrSlug);

        $user = Auth::user();
        if (!$user) {
            abort(401);
        }

        $roleSlug = $this->repo->workspaceRoleSlug($workspace, $user->id);
        if (!in_array($roleSlug, ['owner', 'admin'], true)) {
            abort(403);
        }

        return $workspace;
    }
}
