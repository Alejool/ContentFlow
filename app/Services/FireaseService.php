<?php namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class FirebaseService
{
  protected $auth;

  public function __construct()
  {
    // Inicializar Firebase con las credenciales
    $factory = (new Factory)->withServiceAccount(storage_path('app/firebase-credentials.json'));
    $this->auth = $factory->createAuth();
  }

  public function verifyToken($token)
  {
    try {
      // Verificar el token
      $verifiedIdToken = $this->auth->verifyIdToken($token);
      return $verifiedIdToken->claims()->get('sub'); // Retorna el UID del usuario
    } catch (FailedToVerifyToken $e) {
      // El token no es válido
      return null;
    }
  }
}