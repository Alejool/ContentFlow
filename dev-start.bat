@echo off
chcp 65001 >nul
cls

echo.
echo ========================================
echo 🚀 ContentFlow - Desarrollo Optimizado
echo ========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker no está instalado
    pause
    exit /b 1
)

echo 🧹 Limpiando caché...
docker-compose -f docker-compose.dev.yml exec -T app php artisan cache:forget last_deployment 2>nul

echo 🐳 Levantando servicios...
docker-compose -f docker-compose.dev.yml up -d

echo 🔄 Reiniciando Vite para aplicar variables de entorno...
docker-compose -f docker-compose.dev.yml restart vite

echo ⏳ Esperando servicios...
timeout /t 5 /nobreak >nul

echo 📦 Verificando dependencias...
docker-compose -f docker-compose.dev.yml exec -T app composer install --no-interaction --prefer-dist 2>nul

echo 🗄️ Ejecutando migraciones...
docker-compose -f docker-compose.dev.yml exec -T app php artisan migrate --force 2>nul

REM Actualizar timestamp
for /f %%i in ('powershell -command "[int][double]::Parse((Get-Date -UFormat %%s))"') do set TIMESTAMP=%%i
docker-compose -f docker-compose.dev.yml exec -T app php artisan cache:put last_deployment %TIMESTAMP% 3600

echo.
echo ========================================
echo ✅ ContentFlow está listo!
echo ========================================
echo.
echo 🌐 Aplicación:     http://localhost
echo 🔥 Vite HMR:       http://localhost:5173
echo 💓 Health Check:   http://localhost/api/health
echo 🔌 Reverb:         ws://localhost:8081
echo.
echo ========================================
echo.
echo 📊 Ver logs:  docker-compose -f docker-compose.dev.yml logs -f
echo 🛑 Detener:   docker-compose -f docker-compose.dev.yml down
echo.
pause
