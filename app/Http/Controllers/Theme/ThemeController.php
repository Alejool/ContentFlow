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
   * Update the user's theme preference.
   */
  public function update(Request $request)
  {
    // Allow updating either 'theme' (light/dark) or 'theme_color' (primary color)
    $validated = $request->validate([
      'theme' => ['nullable', Rule::in(['light', 'dark'])],
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
        'message' => 'Theme updated successfully'
      ]);
    }

    return response()->json([
      'success' => false,
      'message' => 'User not authenticated'
    ], 401);
  }
}
