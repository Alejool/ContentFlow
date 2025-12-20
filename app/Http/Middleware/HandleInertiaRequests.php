<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
  /**
   * The root template that is loaded on the first page visit.
   *
   * @var string
   */
  protected $rootView = 'app';

  /**
   * Determine the current asset version.
   */
  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  /**
   * Define the props that are shared by default.
   *
   * @return array<string, mixed>
   */
  public function share(Request $request): array
  {
    return array_merge(parent::share($request), [
      'auth' => [
        'user' => $request->user() ? [
          'id' => $request->user()->id,
          'name' => $request->user()->name,
          'email' => $request->user()->email,
          'email_verified_at' => $request->user()->email_verified_at,
          'locale' => $request->user()->locale ?? 'es',
          'created_at' => $request->user()->created_at,
          'photo_url' => $request->user()->photo_url,
          'theme' => $request->user()->theme,
          'provider' => $request->user()->provider,
          'phone' => $request->user()->phone,
          'bio' => $request->user()->bio,
          'country_code' => $request->user()->country_code,
          'global_platform_settings' => $request->user()->global_platform_settings ?? [],
        ] : null,
      ],
      'flash' => [
        'message' => fn() => $request->session()->get('message')
      ],
      'ziggy' => fn() => [
        ...(new Ziggy)->toArray(),
        'location' => $request->url(),
      ],
    ]);
  }
}
