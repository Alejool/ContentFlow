<?php

namespace App\Http\Controllers\Publications;

use App\Http\Controllers\Controller;
use App\Models\Publications\Publication;
use App\Services\Publications\PublicationLockService;
use App\Traits\System\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PublicationLockController extends Controller
{
    use ApiResponse;

    public function __construct(private PublicationLockService $lockService)
    {
    }

    public function index()
    {
        $locks = $this->lockService->listForWorkspace(Auth::user()->current_workspace_id);

        return $this->successResponse(['locks' => $locks]);
    }

    public function lock(Request $request, Publication $publication)
    {
        $result = $this->lockService->acquire(
            $publication,
            Auth::user(),
            (bool) $request->input('force', false),
            $request->ip(),
            $request->userAgent()
        );

        if (!$result['ok']) {
            return $this->errorResponse($result['error'], $result['status'], $result['meta'] ?? []);
        }

        return $this->successResponse(['lock' => $result['lock']], 'Lock acquired');
    }

    public function unlock(Publication $publication)
    {
        $this->lockService->release($publication, Auth::user());

        return $this->successResponse(null, 'Lock released');
    }

    public function status(Publication $publication)
    {
        return $this->successResponse(['lock' => $this->lockService->status($publication)]);
    }
}
