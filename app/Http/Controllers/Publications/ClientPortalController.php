<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Http\Requests\Publications\RejectViaPortalRequest;
use App\Repositories\PublicationPortalRepository;
use App\Services\Publications\ClientPortalService;
use App\Traits\System\ApiResponse;
use Inertia\Inertia;

class ClientPortalController extends Controller
{
    use ApiResponse;

    public function __construct(
        private PublicationPortalRepository $portal,
        private ClientPortalService $portalService,
    ) {}

    /** Render the client portal page. */
    public function renderPortal($token)
    {
        $publication = $this->portal->findByTokenUnscoped($token);

        return Inertia::render('Portal/ClientPortal', [
            'publication' => $publication,
            'token' => $token,
        ]);
    }

    /** Show publication details for the client portal. */
    public function show($token)
    {
        $publication = $this->portal->findByTokenWithRelations($token);

        if (!$publication) {
            return $this->errorResponse('Invalid or expired portal link.', 404);
        }

        return $this->successResponse(['publication' => $publication]);
    }

    /** Approve publication via portal. */
    public function approve($token)
    {
        $publication = $this->portal->findByToken($token);

        if (!$publication) {
            return $this->errorResponse('Invalid or expired portal link.', 404);
        }

        $result = $this->portalService->approve($publication);
        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse(['message' => $result['message']]);
    }

    /** Reject publication via portal. */
    public function reject(RejectViaPortalRequest $request, $token)
    {
        $publication = $this->portal->findByToken($token);

        if (!$publication) {
            return $this->errorResponse('Invalid or expired portal link.', 404);
        }

        $result = $this->portalService->reject($publication, $request->reason);
        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status']);
        }

        return $this->successResponse(['message' => $result['message']]);
    }

    /**
     * Generate (or return existing) portal token for a publication.
     * Called from the dashboard to obtain the shareable link.
     */
    public function generateToken($id)
    {
        $publication = $this->portal->findById($id);

        return $this->successResponse($this->portalService->ensureToken($publication));
    }
}
