<!DOCTYPE html>
<html>
<head>
    <title>Autenticación completada</title>
    <script>
        window.onload = function() {
            // Enviar mensaje a la ventana principal
            if (window.opener) {
                window.opener.postMessage({
                    type: 'social_auth_callback',
                    success: {{ $success ? 'true' : 'false' }},
                    data: {!! isset($data) ? $data : 'null' !!}
                }, '*');
                
                // Cerrar esta ventana después de un breve retraso
                setTimeout(function() {
                    window.close();
                }, 1000);
            }
        };
    </script>
</head>
<body>
    <div style="text-align: center; margin-top: 50px;">
        @if($success)
            <h2>Autenticación completada</h2>
            <p>Esta ventana se cerrará automáticamente.</p>
        @else
            <h2>Error en la autenticación</h2>
            <p>{{ $message ?? 'Ocurrió un error durante el proceso de autenticación.' }}</p>
            <p>Esta ventana se cerrará automáticamente.</p>
        @endif
    </div>
</body>
</html>