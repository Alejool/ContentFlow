<?php

namespace App\Http\Controllers\Social;

use App\Services\Social\SocialManager;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SocialPostController extends Controller
{
  protected $socialManager;

  public function __construct(SocialManager $socialManager)
  {
    $this->socialManager = $socialManager;
  }

  public function schedulePost(Request $request)
  {
    $request->validate([
      'content' => 'required',
      'platforms' => 'required|array',
      'scheduled_at' => 'nullable|date'
    ]);

    $post = $this->socialManager->schedule(
      $request->user(),
      $request->platforms,
      $request->content,
      $request->scheduled_at
    );

    return response()->json(['post' => $post]);
  }

  public function getAnalytics(Request $request)
  {
    $analytics = $this->socialManager->getAnalytics(
      $request->user(),
      $request->platforms,
      $request->date_range
    );

    return response()->json($analytics);
  }
}
