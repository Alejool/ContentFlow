<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ThemeController extends Controller
{
    /**
     * Update the user's theme preference.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'theme' => ['required', Rule::in(['light', 'dark'])],
        ]);

        $user = Auth::user();
        
        if ($user) {
            $user->theme = $validated['theme'];
            $user->save();

            return response()->json([
                'success' => true,
                'theme' => $user->theme,
                'message' => 'Theme preference updated successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'User not authenticated'
        ], 401);
    }
}
