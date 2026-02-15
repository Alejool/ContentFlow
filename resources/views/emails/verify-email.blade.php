@extends('emails.layouts.default')

@section('content')
<h1>{{ __('notifications.verify_email.title', [], $locale ?? 'es') }}</h1>

<p>{{ __('notifications.verify_email.greeting', ['name' => $user->name ?? 'Usuario'], $locale ?? 'es') }}</p>

<p>
    {{ __('notifications.verify_email.welcome', ['app' => config('app.name')], $locale ?? 'es') }}
</p>

<div class="btn-container">
    <a href="{{ $verificationUrl }}" class="btn">{{ __('notifications.verify_email.action', [], $locale ?? 'es') }}</a>
</div>

<p class="text-sm text-muted" style="margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
    <strong>{{ __('notifications.verify_email.security_note_label', [], $locale ?? 'es') }}</strong> {{ __('notifications.verify_email.security_note', ['count' => config('auth.verification.expire', 60)], $locale ?? 'es') }}
</p>

<div style="margin-top: 24px;">
    <p class="text-sm text-muted">
        {{ __('notifications.verify_email.button_trouble', [], $locale ?? 'es') }}
    </p>
    <p class="text-sm break-all" style="color: #FF6D1F;">
        <a href="{{ $verificationUrl }}" style="color: #FF6D1F; text-decoration: none;">{{ $verificationUrl }}</a>
    </p>
</div>
@endsection