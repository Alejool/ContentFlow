<!DOCTYPE html>
<html lang="{{ $locale ?? 'es' }}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $subject ?? config('app.name') }}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
    }

    .email-wrapper {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .email-header {
      background-color: #ffffff;
      padding: 30px 40px;
      text-align: center;
      border-bottom: 1px solid #f3f4f6;
    }

    .email-logo {
      height: 40px;
      width: auto;
    }

    .email-body {
      padding: 40px;
    }

    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }

    h1 {
      color: #111827;
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 24px;
      text-align: center;
    }

    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 24px;
    }

    .btn-container {
      text-align: center;
      margin: 32px 0;
    }

    .btn {
      display: inline-block;
      background-color: #FF6D1F;
      color: #ffffff !important;
      font-weight: 600;
      text-decoration: none;
      padding: 12px 32px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .btn:hover {
      background-color: #ea580c;
    }

    .text-sm {
      font-size: 14px;
    }

    .text-muted {
      color: #6b7280;
    }

    .break-all {
      word-break: break-all;
    }

    .verification-code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #111827;
      text-align: center;
      margin: 32px 0;
      background: #f3f4f6;
      padding: 24px;
      border-radius: 8px;
    }
  </style>
  @stack('styles')
</head>

<body>
  <div class="email-wrapper">
    <div class="email-header">
      <!-- Replace with actual logo URL if available, using text for now or a placeholder -->
      <div style="font-size: 24px; font-weight: 800; color: #FF6D1F;">ContentFlow</div>
    </div>

    <div class="email-body">
      @yield('content')
    </div>

    <div class="email-footer">
      <p>&copy; {{ date('Y') }} {{ config('app.name') }}. {{ __('notifications.rights_reserved', [], $locale ?? 'es') }}</p>
      <p>{{ __('notifications.email_footer', [], $locale ?? 'es') }}</p>
    </div>
  </div>
</body>

</html>