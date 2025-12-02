<!DOCTYPE html>
<html lang="{{ $locale ?? 'en' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ __('verification.title', [], $locale ?? 'en') }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .email-header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .email-header p {
            color: #e0e7ff;
            margin: 10px 0 0 0;
            font-size: 16px;
        }
        .email-body {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 20px;
            color: #1f2937;
            margin: 0 0 20px 0;
            font-weight: 600;
        }
        .content {
            color: #4b5563;
            font-size: 16px;
            line-height: 1.6;
            margin: 0 0 30px 0;
        }
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        .verify-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(102, 126, 234, 0.5);
            transition: transform 0.2s;
        }
        .verify-button:hover {
            transform: translateY(-2px);
        }
        .info-box {
            background-color: #f9fafb;
            border-left: 4px solid #667eea;
            padding: 16px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.5;
        }
        .link-text {
            word-break: break-all;
            color: #667eea;
            font-size: 13px;
            margin: 20px 0;
            padding: 12px;
            background-color: #f3f4f6;
            border-radius: 6px;
        }
        .email-footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .email-footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            display: inline-block;
            margin: 0 10px;
            color: #9ca3af;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1>✨ {{ __('verification.title', [], $locale ?? 'en') }}</h1>
            <p>{{ __('verification.welcome', ['app' => config('app.name')], $locale ?? 'en') }}</p>
        </div>
        
        <div class="email-body">
            <p class="greeting">{{ __('verification.greeting', ['name' => $user->name], $locale ?? 'en') }} 👋</p>
            
            <p class="content">
                {{ __('verification.thanks', [], $locale ?? 'en') }}
            </p>
            
            <div class="button-container">
                <a href="{{ $verificationUrl }}" class="verify-button">
                    {{ __('verification.verify_button', [], $locale ?? 'en') }}
                </a>
            </div>
            
            <div class="info-box">
                <p>
                    <strong>🔒 {{ __('verification.security_note', [], $locale ?? 'en') }}</strong> {{ __('verification.security_message', [], $locale ?? 'en') }}
                </p>
            </div>
            
            <p class="content" style="margin-top: 30px;">
                {{ __('verification.button_help', [], $locale ?? 'en') }}
            </p>
            
            <div class="link-text">
                {{ $verificationUrl }}
            </div>
        </div>
        
        <div class="email-footer">
            <p><strong>{{ config('app.name') }}</strong></p>
            <p>© {{ date('Y') }} {{ config('app.name') }}. {{ __('verification.rights', [], $locale ?? 'en') }}</p>
            <p style="margin-top: 15px; font-size: 12px;">
                {{ __('verification.footer', [], $locale ?? 'en') }}
            </p>
        </div>
    </div>
</body>
</html>
