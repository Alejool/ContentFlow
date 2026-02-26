<?php

namespace App\Http\Controllers\Theme;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
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
  public function update(Request $request)
  {
    $validated = $request->validate([
      'theme' => ['nullable', Rule::in(['light', 'dark', 'system'])],
      'theme_color' => ['nullable', 'string', 'in:orange,blue,purple,green,yellow,pink,red,indigo,teal,sky'],
    ]);

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
