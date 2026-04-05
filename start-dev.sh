#!/usr/bin/env bash
# Script simple para iniciar desarrollo SIN rebuild
# Evita el error de credenciales de Docker

echo 'Iniciando entorno de DESARROLLO...'
docker-compose -f docker-compose.dev.yml up -d

echo ''
echo 'Estado de servicios:'
docker-compose -f docker-compose.dev.yml ps

echo ''
echo 'Entorno disponible en:'
echo '  - Aplicacion: http://localhost'
echo '  - Vite HMR: http://localhost:5173'
echo '  - WebSockets: ws://localhost:8081'
echo '  - Redis UI: http://localhost:8082'
