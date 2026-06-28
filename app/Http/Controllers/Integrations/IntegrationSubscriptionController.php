<?php

namespace App\Http\Controllers\Integrations;

use App\Constants\IntegrationEvents;
use App\Http\Controllers\Controller;
use App\Models\Integrations\IntegrationDeliveryLog;
use App\Models\Integrations\IntegrationEventSubscription;
use App\Models\Workspace\Workspace;
use App\Services\Integrations\IntegrationEventDispatcher;
use App\Traits\System\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class IntegrationSubscriptionController extends Controller
{
    use ApiResponse;

    /** GET /api/v1/workspaces/{ws}/integrations/subscriptions */
    public function index(string $idOrSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $this->authorizeAdmin($workspace);

        $grouped = IntegrationEventSubscription::query()
            ->forWorkspace($workspace->id)
            ->orderBy('channel_type')
            ->orderBy('event_type')
            ->get()
            ->groupBy('channel_type');

        return $this->successResponse([
            'subscriptions'     => $grouped,
            'supported_channels' => IntegrationEventSubscription::supportedChannels(),
            'event_definitions'  => IntegrationEvents::groups(),
        ]);
    }

    /** POST /api/v1/workspaces/{ws}/integrations/subscriptions */
    public function store(Request $request, string $idOrSlug): JsonResponse
    {
        $workspace = $this->resolveWorkspace($idOrSlug);
        $this->authorizeAdmin($workspace);

        $validated = $request->validate([
            'channel_type' => ['required', 'string', 'in:' . implode(',', array_keys(IntegrationEventSubscription::supportedChannels()))],
            'channel_name' => 'nullable|string|max:128',
            'event_type'   => ['required', 'string', 'in:' . implode(',', IntegrationEvents::all())],
            'config'       => 'required|array',
            'is_active'    => 'boolean',
        ]);

        $subscription = IntegrationEventSubscription::create([
            'workspace_id' => $workspace->id,
            ...$validated,
        ]);

        return $this->successResponse(['subscription' => $subscription], 'Subscription created.', 201);
    }

    /** PUT /api/v1/workspaces/{ws}/integrations/subscriptions/{id} */
    public function update(Request $request, string $idOrSlug, int $id): JsonResponse
    {
        $workspace    = $this->resolveWorkspace($idOrSlug);
        $this->authorizeAdmin($workspace);
        $subscription = IntegrationEventSubscription::where('workspace_id', $workspace->id)->findOrFail($id);

        $validated = $request->validate([
            'channel_name' => 'nullable|string|max:128',
            'config'       => 'sometimes|array',
            'is_active'    => 'sometimes|boolean',
        ]);

        $subscription->update($validated);

        return $this->successResponse(['subscription' => $subscription], 'Subscription updated.');
    }

    /** DELETE /api/v1/workspaces/{ws}/integrations/subscriptions/{id} */
    public function destroy(string $idOrSlug, int $id): JsonResponse
    {
        $workspace    = $this->resolveWorkspace($idOrSlug);
        $this->authorizeAdmin($workspace);
        $subscription = IntegrationEventSubscription::where('workspace_id', $workspace->id)->findOrFail($id);
        $subscription->delete();

        return $this->successResponse(null, 'Subscription deleted.');
    }

    /** POST /api/v1/workspaces/{ws}/integrations/subscriptions/{id}/test */
    public function test(string $idOrSlug, int $id): JsonResponse
    {
        $workspace    = $this->resolveWorkspace($idOrSlug);
        $this->authorizeAdmin($workspace);
        $subscription = IntegrationEventSubscription::where('workspace_id', $workspace->id)->findOrFail($id);

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
        $this->authorizeAdmin($workspace);

        $logs = IntegrationDeliveryLog::query()
            ->where('workspace_id', $workspace->id)
            ->with('subscription')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->successResponse(['logs' => $logs]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function resolveWorkspace(string $idOrSlug): Workspace
    {
        return Workspace::where('id', $idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->firstOrFail();
    }

    private function authorizeAdmin(Workspace $workspace): void
    {
        $user = Auth::user();
        if (!$user) abort(401);

        $pivot = $workspace->users()->where('users.id', $user->id)->first()?->pivot;
        if (!$pivot) abort(403);

        $roleSlug = \App\Models\Auth\Role::find($pivot->role_id)?->slug;
        if (!in_array($roleSlug, ['owner', 'admin'])) abort(403);
    }
}
