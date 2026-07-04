<?php

namespace App\Http\Controllers\Theme;

use App\Http\Requests\Theme\UpdateThemeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use App\Http\Controllers\Controller;

class ThemeController extends Controller
{
  /**
   * Fetch the user's theme preference.
   */
  public function fetch(Request $request)
  {
    $user = Auth::user();

    if ($user) {
      return response()->json([
        'success' => true,
        'theme' => $user->theme ?? 'system',
        'theme_color' => $user->theme_color ?? 'blue',
      ]);
    }

    return response()->json([
      'success' => false,
      'message' => __('messages.auth.not_authenticated')
    ], 401);
  }

  /**
   * Update the user's theme preference.
   */
  public function update(UpdateThemeRequest $request)
  {
    $validated = $request->validated();

    $user = Auth::user();

    if ($user) {
      if (isset($validated['theme'])) {
        $user->theme = $validated['theme'];
      }

      if (isset($validated['theme_color'])) {
        $user->theme_color = $validated['theme_color'];
      }

      $user->save();

      return response()->json([
        'success' => true,
        'message' => __('messages.theme.updated')
      ]);
    }

    return response()->json([
      'success' => false,
      'message' => __('messages.auth.not_authenticated')
    ], 401);
  }
}
