<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class IsSuperAdmin
{
  /**
   * Handle an incoming request.
   *
   * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
   */
  public function handle(Request $request, Closure $next): Response
  {
    \Illuminate\Support\Facades\Log::emergency('--- MIDDLEWARE IsSuperAdmin EXECUTING ---');
    $user = Auth::user();
    $isSuperAdmin = $user && $user->is_super_admin === true;

    if (!$isSuperAdmin) {
      if ($request->expectsJson() || $request->ajax()) {
        return response()->json(['message' => 'Unauthorized. Super Admin access required.'], 403);
      }

      return redirect()->route('dashboard')->with('error', 'Unauthorized. Super Admin access required.');
    }

    return $next($request);
  }
}
