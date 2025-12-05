<?php

namespace App\Services;

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

  /**
   * Verify token and return only UID (legacy method)
   */
  public function verifyToken($token)
  {
    try {
      $verifiedIdToken = $this->auth->verifyIdToken($token);
      return $verifiedIdToken->claims()->get('sub'); // Returns the user's UID
    } catch (FailedToVerifyToken $e) {
      return null;
    }
  }

  /**
   * Verify token and return complete user information
   */
  public function verifyTokenAndGetUser($token)
  {
    try {
      // Verify the token
      $verifiedIdToken = $this->auth->verifyIdToken($token);
      $claims = $verifiedIdToken->claims()->all();

      // Get user from Firebase Auth
      $uid = $claims['sub'] ?? $claims['user_id'] ?? null;

      if (!$uid) {
        return null;
      }

      // Try to get additional user data from Firebase Auth
      try {
        $firebaseUser = $this->auth->getUser($uid);

        return [
          'uid' => $uid,
          'email' => $firebaseUser->email,
          'email_verified' => $firebaseUser->emailVerified,
          'name' => $firebaseUser->displayName,
          'displayName' => $firebaseUser->displayName,
          'photoURL' => $firebaseUser->photoUrl,
          'picture' => $firebaseUser->photoUrl,
          'phone' => $firebaseUser->phoneNumber,
          'disabled' => $firebaseUser->disabled,
          'metadata' => [
            'createdAt' => $firebaseUser->metadata->createdAt,
            'lastLoginAt' => $firebaseUser->metadata->lastLoginAt,
            'lastRefreshAt' => $firebaseUser->metadata->lastRefreshAt,
          ],
          'providerData' => $firebaseUser->providerData,
        ];
      } catch (\Exception $e) {
        // If we can't get user from Firebase Auth, use claims data
        return [
          'uid' => $uid,
          'email' => $claims['email'] ?? null,
          'email_verified' => $claims['email_verified'] ?? false,
          'name' => $claims['name'] ?? null,
          'displayName' => $claims['name'] ?? null,
          'picture' => $claims['picture'] ?? null,
          'photoURL' => $claims['picture'] ?? null,
        ];
      }
    } catch (FailedToVerifyToken $e) {
      \Log::error('Failed to verify Firebase token: ' . $e->getMessage());
      return null;
    } catch (\Exception $e) {
      \Log::error('Firebase service error: ' . $e->getMessage());
      return null;
    }
  }
}
