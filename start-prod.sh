#!/bin/bash
# Script simple para iniciar producción SIN rebuild
# Evita el error de credenciales de Docker

echo "Iniciando entorno de PRODUCCIÓN..."
docker-compose up -d

echo ""
echo "Estado de servicios:"
docker-compose ps

echo ""
echo "Entorno disponible en:"
echo "  - Aplicacion: http://localhost"
echo "  - WebSockets: ws://localhost:8081"
echo "  - Redis UI: http://localhost:8082"
