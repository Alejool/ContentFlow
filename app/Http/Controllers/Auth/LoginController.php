<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;

class LoginController extends Controller
{
  /**
   * Checks if the user exists and how they registered.
   */
  public function checkUser(Request $request)
  {
    $request->validate([
      'email' => 'required|email',
    ]);

    // TEST COMMENT TO CHECK IF EMAIL ARRIVES
    // return response()->json([
    // 'error' => 'User not found.',
    // ], 404);

    // Find the user by their email
    $user = User::where('email', $request->email)->first();

    if (!$user) {
      return response()->json([
        'error' => 'User not found.',
      ], 404);
    }

    // Check if the user registered with an external provider
    if ($user->provider) {
      return response()->json([
        'provider' => $user->provider,
      ]);
    }

    // If the user registered with email and password
    return response()->json([
      'provider' => null,
    ]);
  }


  // public function checkUser(Request $request)
  // {
  //   echo "checkUser";
  //   // Check if the user exists
  //   echo $request->email;

  //     $request->validate([
  //         'email' => 'required|email',
  //     ]);

  //     $user = User::where('email', $request->email)->first();

  //     if (!$user) {
  //         return Inertia::render('Auth/Login', [
  //             'error' => 'User not found.',
  //         ]);
  //     }

  //     if ($user->provider) {
  //       return Inertia::render('Auth/Login', [
  //         'error' => "This user registered with {$user->provider}. Please log in with {$user->provider}.",
  //       ]);
  //     }

  //     // Continue with the login flow
  // }



  // Continue with the login flow
}
