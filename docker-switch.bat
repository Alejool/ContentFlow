@echo off
REM Script para cambiar entre entornos Docker (dev/prod) en Windows

SET ENV=%1

IF "%ENV%"=="" (
    echo Uso: docker-switch.bat [dev^|prod]
    exit /b 1
)

IF "%ENV%"=="dev" (
    echo Cambiando a entorno de DESARROLLO...
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d --build
    echo Entorno DEV levantado en http://localhost
    exit /b 0
)

IF "%ENV%"=="prod" (
    echo Cambiando a entorno de PRODUCCION...
    docker-compose -f docker-compose.dev.yml down
    docker-compose down
    docker-compose up -d --build
    echo Entorno PROD levantado en http://localhost
    exit /b 0
)

echo Opcion invalida. Usa: dev o prod
exit /b 1
