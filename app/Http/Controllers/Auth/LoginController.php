<?php namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Inertia\Inertia;

class LoginController extends Controller
{
/**
* Verifica si el usuario existe y cómo se registró.
*/
public function checkUser(Request $request)
{
  $request->validate([
  'email' => 'required|email',
  ]);

  // COMENTARIO DE PRUEBA DE QUE SI LLEGA EL EMAIL
  // return response()->json([
  // 'error' => 'Usuario no encontrado.',
  // ], 404);

  // Buscar al usuario por su correo electrónico
  $user = User::where('email', $request->email)->first();

  if (!$user) {
  return response()->json([
  'error' => 'Usuario no encontrado.',
  ], 404);
  }

  // Verificar si el usuario se registró con un proveedor externo
  if ($user->provider) {
  return response()->json([
  'provider' => $user->provider,
  ]);
  }

  // Si el usuario se registró con correo y contraseña
  return response()->json([
  'provider' => null,
  ]);
}


// public function checkUser(Request $request)
// {
//   echo "checkUser";
//   // Verificar si el usuario existe
//   echo $request->email;

//     $request->validate([
//         'email' => 'required|email',
//     ]);

//     $user = User::where('email', $request->email)->first();
                                        
//     if (!$user) {
//         return Inertia::render('Auth/Login', [
//             'error' => 'Usuario no encontrado.',
//         ]);
//     }

//     if ($user->provider) {
//       return Inertia::render('Auth/Login', [
//         'error' => "Este usuario se registró con {$user->provider}. Por favor, inicia sesión con {$user->provider}.",
//       ]);
//     }

//     // Continuar con el flujo de inicio de sesión
// }



    // Continuar con el flujo de inicio de sesión
}

