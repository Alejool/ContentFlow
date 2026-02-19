<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication {{ $success ? 'Successful' : 'Failed' }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        .message {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
        }
        .submessage {
            font-size: 0.875rem;
            opacity: 0.9;
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid white;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 1rem auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        @if($success)
            <div class="icon">✓</div>
            <div class="message">Authentication Successful!</div>
            <div class="submessage">This window will close automatically...</div>
        @else
            <div class="icon">✗</div>
            <div class="message">Authentication Failed</div>
            <div class="submessage">{{ $message }}</div>
            <div class="submessage" style="margin-top: 1rem;">This window will close automatically...</div>
        @endif
        <div class="spinner"></div>
    </div>

    <script>
        // Send message to parent window
        if (window.opener) {
            window.opener.postMessage({
                type: 'social_auth_callback',
                success: {{ $success ? 'true' : 'false' }},
                @if($success)
                    account: @json($account),
                @else
                    errorType: '{{ $errorType ?? 'unknown' }}',
                @endif
                message: '{{ $message }}'
            }, window.location.origin);

            // Close popup after a short delay
            setTimeout(() => {
                window.close();
            }, 2000);
        } else {
            // If no opener, redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 3000);
        }
    </script>
</body>
</html>
