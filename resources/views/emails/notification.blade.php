@extends('emails.layouts.default')

@section('content')
@if(isset($level) && $level === 'error')
<h1 style="color: #ef4444;">{{ $title ?? 'Notificación' }}</h1>
@elseif(isset($level) && $level === 'success')
<h1 style="color: #10b981;">{{ $title ?? 'Notificación' }}</h1>
@else
<h1>{{ $title ?? 'Notificación' }}</h1>
@endif

<p>{{ __('notifications.greeting', [], $locale ?? 'es') }}</p>

@foreach ($introLines as $line)
<p>{!! $line !!}</p>
@endforeach

@if (isset($actionText))
<div class="btn-container">
  <a href="{{ $actionUrl }}" class="btn">{{ $actionText }}</a>
</div>
@endif

@foreach ($outroLines as $line)
<p>{!! $line !!}</p>
@endforeach

@if (isset($actionText))
<div style="margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
  <p class="text-sm text-muted">
    {{ __('notifications.action_trouble', ['actionText' => $actionText], $locale ?? 'es') }}
  </p>
  <p class="text-sm break-all" style="color: #FF6D1F;">
    <a href="{{ $actionUrl }}" style="color: #FF6D1F; text-decoration: none;">{{ $actionUrl }}</a>
  </p>
</div>
@endif
@endsection