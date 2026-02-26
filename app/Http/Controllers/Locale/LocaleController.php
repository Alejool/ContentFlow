<?php

namespace App\Http\Controllers\Locale;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

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
            'message' => __('messages.locale.updated'),
        ]);
    }
}
