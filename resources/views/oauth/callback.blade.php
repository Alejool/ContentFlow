<!DOCTYPE html>
<html>
<head>
    <title>Authentication completed</title>
    <script>
        window.onload = function() {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'social_auth_callback',
                    success: {{ $success ? 'true' : 'false' }},
                    data: {!! isset($data) ? $data : 'null' !!}
                }, '*');
                
                setTimeout(function() {
                    window.close();
                }, 500);
            }
        };
    </script>
</head>
<body>
    <div style="text-align: center; margin-top: 50px;">
        @if($success)
            <h2>Authentication completed</h2>
            <p>This window will close automatically.</p>
        @else
            <h2>Authentication error</h2>
            <p>{{ $message ?? 'An error occurred during the authentication process.' }}</p>
            <p>This window will close automatically.</p>
        @endif
    </div>
</body>
</html>