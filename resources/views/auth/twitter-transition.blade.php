<!DOCTYPE html>
<html>
<head>
    <title>Conectando con {{ ucfirst($platform) }}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        
        .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: #1DA1F2;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
        }
        
        h1 {
            font-size: 24px;
            margin-bottom: 12px;
            color: #1a202c;
        }
        
        p {
            color: #718096;
            margin-bottom: 24px;
            line-height: 1.6;
        }
        
        .spinner {
            width: 48px;
            height: 48px;
            margin: 20px auto;
            border: 4px solid #e2e8f0;
            border-top-color: #1DA1F2;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .button {
            display: inline-block;
            background: #1DA1F2;
            color: white;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        
        .button:hover {
            background: #1a91da;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
        }
        
        .manual-link {
            margin-top: 20px;
            font-size: 14px;
            color: #718096;
        }
        
        .manual-link a {
            color: #1DA1F2;
            text-decoration: none;
        }
        
        .manual-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        </div>
        
        <h1>{{ isset($step) && $step === 'v1' ? 'Último paso' : 'Finalizando conexión' }}</h1>
        <p>
            @if(isset($step) && $step === 'v1')
                Completando permisos adicionales para subir contenido...
            @else
                Completando la autenticación con {{ ucfirst($platform) }}...
            @endif
        </p>
        
        <div class="spinner"></div>
        
        <div id="manual-action" style="display: none;">
            <p style="color: #e53e3e; margin-bottom: 16px;">
                La redirección automática no funcionó.
            </p>
            <button onclick="continueAuth()" class="button">
                Continuar manualmente
            </button>
        </div>
        
        <div class="manual-link">
            <small>Si esta ventana no se cierra automáticamente, 
                <a href="#" onclick="continueAuth(); return false;">haz clic aquí</a>
            </small>
        </div>
    </div>

    <script>
        const oauth2Url = @json($oauth2Url);
        let redirectAttempted = false;
        
        function continueAuth() {
            if (!redirectAttempted) {
                redirectAttempted = true;
                window.location.href = oauth2Url;
            }
        }
        
        // Intentar redirección automática después de un breve delay
        // Esto da tiempo para que la página se renderice y evita el "parpadeo"
        setTimeout(function() {
            continueAuth();
        }, 800);
        
        // Mostrar botón manual si la redirección falla después de 3 segundos
        setTimeout(function() {
            if (!redirectAttempted || window.location.href === window.location.href) {
                document.getElementById('manual-action').style.display = 'block';
                document.querySelector('.spinner').style.display = 'none';
            }
        }, 3000);
    </script>
</body>
</html>
