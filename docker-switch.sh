#!/bin/bash

# Script para cambiar entre entornos Docker (dev/prod)

ENV=$1

if [ -z "$ENV" ]; then
    echo "Uso: ./docker-switch.sh [dev|prod]"
    exit 1
fi

case $ENV in
    dev)
        echo "­ƒöä Cambiando a entorno de DESARROLLO..."
        docker-compose down
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up -d --build
        echo "Ô£à Entorno DEV levantado en http://localhost"
        ;;
    prod)
        echo "­ƒöä Cambiando a entorno de PRODUCCI├ôN..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose down
        docker-compose up -d --build
        echo "Ô£à Entorno PROD levantado en http://localhost"
        ;;
    *)
        echo "ÔØî Opci├│n inv├ílida. Usa: dev o prod"
        exit 1
        ;;
esac
