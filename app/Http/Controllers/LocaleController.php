<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LocaleController extends Controller
{
    /**
     * Update the user's locale.
     */
    public function update(Request $request)
    {
        $request->validate([
            'locale' => ['required', 'string', 'in:en,es'],
        ]);

        $user = $request->user();
        $user->locale = $request->locale;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Locale updated successfully',
        ]);
    }
}
