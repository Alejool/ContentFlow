<?php namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class FirebaseService
{
  protected $auth;

  public function __construct()
  {
    // Initialize Firebase with credentials
    $factory = (new Factory)->withServiceAccount(storage_path('app/firebase-credentials.json'));
    $this->auth = $factory->createAuth();
  }

  public function verifyToken($token)
  {
    try {
      // Verify the token
      $verifiedIdToken = $this->auth->verifyIdToken($token);
      return $verifiedIdToken->claims()->get('sub'); // Returns the user's UID
    } catch (FailedToVerifyToken $e) {
      // The token is not valid
      return null;
    }
  }
}