#!/bin/bash

# Script de Migración de Volúmenes
# Migra datos de volúmenes _shared a _prod

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Migración de Volúmenes Docker ContentFlow   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que Docker esté corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERROR]${NC} Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

echo -e "${YELLOW}Este script migrará los datos de volúmenes compartidos a volúmenes de producción:${NC}"
echo "  • contentflow_pgsql_data_shared  → contentflow_pgsql_data_prod"
echo "  • contentflow_redis_data_shared  → contentflow_redis_data_prod"
echo ""

# Verificar si los volúmenes antiguos existen
OLD_PGSQL=$(docker volume ls -q | grep "contentflow_pgsql_data_shared" || echo "")
OLD_REDIS=$(docker volume ls -q | grep "contentflow_redis_data_shared" || echo "")

if [ -z "$OLD_PGSQL" ] && [ -z "$OLD_REDIS" ]; then
    echo -e "${GREEN}[INFO]${NC} No se encontraron volúmenes antiguos (_shared)."
    echo -e "${GREEN}[INFO]${NC} Probablemente ya migraste o es una instalación nueva."
    echo ""
    read -p "¿Deseas continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}[INFO]${NC} Migración cancelada."
        exit 0
    fi
fi

echo -e "${YELLOW}⚠️  ADVERTENCIA:${NC}"
echo "  • Este proceso detendrá todos los servicios"
echo "  • Se creará un backup automático de PostgreSQL"
echo "  • Los volúmenes antiguos NO se eliminarán (por seguridad)"
echo ""

read -p "¿Deseas continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}[INFO]${NC} Migración cancelada."
    exit 0
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 1: Crear Backup de PostgreSQL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_pre_migration_${TIMESTAMP}.sql"

if docker-compose ps | grep -q "contentflow_pgsql"; then
    echo -e "${GREEN}[INFO]${NC} Creando backup: $BACKUP_FILE"
    docker-compose exec -T pgsql pg_dump -U contenflow ContentFlow > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}[WARN]${NC} No se pudo crear backup automático."
        echo -e "${YELLOW}[WARN]${NC} Asegúrate de tener un backup manual antes de continuar."
        read -p "¿Continuar sin backup? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}[INFO]${NC} Migración cancelada."
            exit 0
        fi
    }
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${GREEN}[OK]${NC} Backup creado: $BACKUP_FILE"
    fi
else
    echo -e "${YELLOW}[WARN]${NC} PostgreSQL no está corriendo. No se puede crear backup."
    echo -e "${YELLOW}[INFO]${NC} Asegúrate de tener un backup manual."
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 2: Detener Servicios${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

echo -e "${GREEN}[INFO]${NC} Deteniendo servicios..."
docker-compose down
echo -e "${GREEN}[OK]${NC} Servicios detenidos."

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 3: Migrar Volumen de PostgreSQL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

if [ -n "$OLD_PGSQL" ]; then
    echo -e "${GREEN}[INFO]${NC} Migrando datos de PostgreSQL..."
    
    # Crear volumen nuevo si no existe
    docker volume create contentflow_pgsql_data_prod > /dev/null 2>&1 || true
    
    # Copiar datos
    docker run --rm \
        -v contentflow_pgsql_data_shared:/source:ro \
        -v contentflow_pgsql_data_prod:/target \
        alpine sh -c "cp -a /source/. /target/" && \
    echo -e "${GREEN}[OK]${NC} Datos de PostgreSQL migrados." || \
    echo -e "${RED}[ERROR]${NC} Error al migrar PostgreSQL."
else
    echo -e "${YELLOW}[SKIP]${NC} Volumen antiguo de PostgreSQL no encontrado."
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 4: Migrar Volumen de Redis${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

if [ -n "$OLD_REDIS" ]; then
    echo -e "${GREEN}[INFO]${NC} Migrando datos de Redis..."
    
    # Crear volumen nuevo si no existe
    docker volume create contentflow_redis_data_prod > /dev/null 2>&1 || true
    
    # Copiar datos
    docker run --rm \
        -v contentflow_redis_data_shared:/source:ro \
        -v contentflow_redis_data_prod:/target \
        alpine sh -c "cp -a /source/. /target/" && \
    echo -e "${GREEN}[OK]${NC} Datos de Redis migrados." || \
    echo -e "${RED}[ERROR]${NC} Error al migrar Redis."
else
    echo -e "${YELLOW}[SKIP]${NC} Volumen antiguo de Redis no encontrado."
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 5: Iniciar Servicios con Nuevos Volúmenes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

echo -e "${GREEN}[INFO]${NC} Iniciando servicios..."
docker-compose up -d

echo -e "${GREEN}[INFO]${NC} Esperando a que los servicios estén listos..."
sleep 10

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 6: Verificar Servicios${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

echo ""
docker-compose ps

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Paso 7: Verificar Salud${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

echo ""
echo "PostgreSQL:"
if docker-compose exec pgsql pg_isready -U contenflow > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ OK${NC}"
else
    echo -e "  ${RED}✗ ERROR${NC}"
fi

echo "Redis:"
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ OK${NC}"
else
    echo -e "  ${RED}✗ ERROR${NC}"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Migración Completada                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}[INFO]${NC} Backup guardado en: $BACKUP_FILE"
fi

echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Verificar que la aplicación funcione correctamente"
echo "  2. Probar conexión a base de datos y Redis"
echo "  3. Si todo funciona, puedes eliminar los volúmenes antiguos:"
echo ""
echo -e "     ${BLUE}docker volume rm contentflow_pgsql_data_shared${NC}"
echo -e "     ${BLUE}docker volume rm contentflow_redis_data_shared${NC}"
echo ""
echo -e "${YELLOW}[IMPORTANTE]${NC} NO elimines los volúmenes antiguos hasta estar seguro de que todo funciona."
echo ""

# Listar volúmenes
echo -e "${BLUE}Volúmenes actuales:${NC}"
docker volume ls | grep contentflow

echo ""
echo -e "${GREEN}[INFO]${NC} Migración finalizada exitosamente."
