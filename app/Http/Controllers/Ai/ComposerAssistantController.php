<?php

namespace App\Http\Controllers\Ai;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ai\ComposerAssistantRequest;
use App\Services\AI\ComposerAssistantService;
use Illuminate\Http\JsonResponse;

class ComposerAssistantController extends Controller
{
  public function __construct(private ComposerAssistantService $assistant)
  {
  }

  public function suggest(ComposerAssistantRequest $request): JsonResponse
  {
    $user = $request->user();

    $suggestion = $this->assistant->suggest(
      (int) $user->current_workspace_id,
      $request->input('platforms', []),
      $request->input('draft'),
      $request->input('timezone', config('app.timezone', 'UTC')),
      $request->input('locale', 'es'),
    );

    return response()->json(['success' => true, 'data' => $suggestion]);
  }
}
