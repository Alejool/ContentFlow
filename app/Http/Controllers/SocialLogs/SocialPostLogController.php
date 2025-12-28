<?php

namespace App\Http\Controllers\SocialLogs;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\SocialPostLog;
use App\Services\SocialPostLogService;
use App\Services\PlatformPublishService;
use Illuminate\Http\Request;




class SocialPostLogController extends Controller
{
  public function __construct(
    private SocialPostLogService $logService,
    private PlatformPublishService $publishService
  ) {
  }

  /**
   * Obtener publicaciones de una campaña
   */
  public function index(Request $request, $campaignId)
  {
    $campaign = Campaign::findOrFail($campaignId);

    if ($campaign->user_id !== auth()->id()) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized',
      ], 403);
    }

    $result = $this->logService->getCampaignLogs($campaignId, auth()->id());

    return response()->json([
      'success' => true,
      'campaign' => $campaign->only(['id', 'title', 'status']),
      'publications' => $result['logs'],
      'summary' => $result['summary'],
    ]);
  }

  /**
   * Obtener un log específico
   */
  public function show($id)
  {
    $log = SocialPostLog::with([
      'socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name'),
      'user' => fn($q) => $q->select('id', 'name', 'email')
    ])->findOrFail($id);

    // Verificar que el log pertenece al usuario
    if ($log->user_id !== auth()->id()) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized',
      ], 403);
    }

    return response()->json([
      'success' => true,
      'log' => $log,
    ]);
  }

  /**
   * Obtener todas las publicaciones fallidas del usuario
   */
  public function failed()
  {
    $failedLogs = $this->logService->getFailedLogs(auth()->id());

    return response()->json([
      'success' => true,
      'failed_publications' => $failedLogs,
      'total' => $failedLogs->count(),
    ]);
  }

  /**
   * Reintentar una publicación fallida específica
   */
  public function retry($id)
  {
    $log = SocialPostLog::with([
      'socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name', 'access_token', 'refresh_token')
    ])->findOrFail($id);

    // Verificar permisos
    if ($log->user_id !== auth()->id()) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized',
      ], 403);
    }

    if ($log->status !== 'failed') {
      return response()->json([
        'success' => false,
        'message' => 'Only failed publications can be retried',
      ], 422);
    }

    try {
      // Resetear el log
      $this->logService->resetForRetry($log);

      // Aquí deberías implementar la lógica de reintento
      // Por ahora solo actualizamos el estado

      return response()->json([
        'success' => true,
        'message' => 'Retry initiated',
        'log' => $log->fresh(),
      ]);
    } catch (\Exception $e) {
      return response()->json([
        'success' => false,
        'message' => 'Retry failed: ' . $e->getMessage(),
      ], 500);
    }
  }

  /**
   * Reintentar todas las publicaciones fallidas de una campaña
   */
  public function retryAllFailed($campaignId)
  {
    $campaign = Campaign::with([
      'mediaFiles' => fn($q) => $q->select('media_files.id', 'media_files.file_path', 'media_files.file_type', 'media_files.file_name')
    ])->findOrFail($campaignId);

    if ($campaign->user_id !== auth()->id()) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized',
      ], 403);
    }

    $failedLogs = SocialPostLog::where('user_id', auth()->id())
      ->where('status', 'failed')
      ->with([
        'socialAccount' => fn($q) => $q->select('id', 'platform', 'account_name', 'access_token', 'refresh_token')
      ])
      ->get();

    if ($failedLogs->isEmpty()) {
      return response()->json([
        'success' => false,
        'message' => 'No failed publications to retry',
      ], 404);
    }

    $retried = 0;
    $stillFailed = 0;

    foreach ($failedLogs as $log) {
      try {
        $this->logService->resetForRetry($log);
        // Implementar lógica de reintento aquí
        $retried++;
      } catch (\Exception $e) {
        $this->logService->markAsFailed($log, 'Retry failed: ' . $e->getMessage());
        $stillFailed++;
      }
    }

    return response()->json([
      'success' => true,
      'message' => "Retry completed",
      'retried' => $retried,
      'still_failed' => $stillFailed,
    ]);
  }

  /**
   * Eliminar un log
   */
  public function destroy($id)
  {
    $log = SocialPostLog::findOrFail($id);

    if ($log->user_id !== auth()->id()) {
      return response()->json([
        'success' => false,
        'message' => 'Unauthorized',
      ], 403);
    }

    $log->delete();

    return response()->json([
      'success' => true,
      'message' => 'Publication log deleted',
    ]);
  }
}
