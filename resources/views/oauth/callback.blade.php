<!DOCTYPE html>
<html>
<head>
    <title>Authentication completed</title>
    <script>
        window.onload = function() {
            if (window.opener) {
                const messageData = {
                    type: 'social_auth_callback',
                    success: {{ $success ? 'true' : 'false' }}
                };

                @if($success)
                    messageData.data = {!! isset($data) ? $data : 'null' !!};
                @else
                    messageData.message = '{{ $message ?? 'An error occurred during the authentication process.' }}';
                    messageData.errorType = '{{ $errorType ?? 'unknown' }}';
                @endif

                window.opener.postMessage(messageData, window.location.origin);
                
                // Aumentar el tiempo para ver el error (3 segundos)
                setTimeout(function() {
                    window.close();
                }, 3000);
            }
        };
    </script>
</head>
<body>
    <div style="text-align: center; margin-top: 50px; padding: 20px;">
        @if($success)
            <h2 style="color: #10b981;">✓ Authentication completed</h2>
            <p>This window will close automatically in 3 seconds.</p>
        @else
            <h2 style="color: #ef4444;">✗ Authentication error</h2>
            <p style="color: #dc2626; font-weight: bold;">{{ $message ?? 'An error occurred during the authentication process.' }}</p>
            <p style="color: #6b7280; font-size: 14px;">Error Type: {{ $errorType ?? 'unknown' }}</p>
            <p style="margin-top: 20px;">This window will close automatically in 3 seconds.</p>
        @endif
    </div>
</body>
</html>