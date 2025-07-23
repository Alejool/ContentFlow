<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\FirebaseService;

class AuthController extends Controller
{
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function verifyFirebaseToken(Request $request)
    {
        // Validate that the token is present in the request
        $request->validate([
            'token' => 'required|string',
        ]);

        // Get the token from the request
        $token = $request->input('token');

        // Verify the token using FirebaseService
        $uid = $this->firebaseService->verifyToken($token);

        if ($uid) {
            // The token is valid
            return response()->json([
                'message' => 'Authenticated',
                'uid' => $uid,
            ], 200);
        }

        // The token is not valid
        return response()->json([
            'error' => 'Invalid token',
        ], 401);
    }
}