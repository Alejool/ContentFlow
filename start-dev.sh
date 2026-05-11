#!/usr/bin/env bash
# =============================================================================
# start-dev.sh — Inicio inteligente del entorno de desarrollo ContentFlow
#
# Comportamiento:
#   - Primera vez: build de imágenes + install de dependencias + migraciones
#   - Siguientes veces: levanta los contenedores existentes directamente
#   - Siempre: espera a que la app esté realmente lista antes de terminar
# =============================================================================

set -e

COMPOSE="docker-compose -f docker-compose.dev.yml"
APP_IMAGE="contentflow_app_dev"
VENDOR_VOLUME="contentflow_vendor_dev"
NODE_VOLUME="contentflow_node_modules_dev"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()     { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()   { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()  { echo -e "${RED}[ERROR]${NC} $1"; }
step()   { echo -e "\n${CYAN}▶ $1${NC}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     ContentFlow — Entorno de Desarrollo  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Verificar que Docker esté corriendo
# =============================================================================
step "Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    error "Docker no está corriendo. Inicia Docker Desktop e intenta de nuevo."
    exit 1
fi
ok "Docker está activo"

# =============================================================================
# 2. Verificar si existe el archivo .env.docker
# =============================================================================
step "Verificando configuración..."
if [ ! -f ".env.docker" ]; then
    if [ -f ".env.docker.example" ]; then
        warn ".env.docker no encontrado. Copiando desde .env.docker.example..."
        cp .env.docker.example .env.docker
        warn "⚠️  Revisa y configura .env.docker antes de continuar."
        warn "   Especialmente: DB_PASSWORD, APP_KEY, REVERB_APP_KEY"
        echo ""
        read -p "¿Continuar con los valores por defecto? [s/N]: " confirm
        if [[ ! "$confirm" =~ ^[sS]$ ]]; then
            log "Edita .env.docker y vuelve a ejecutar ./start-dev.sh"
            exit 0
        fi
    else
        error ".env.docker no encontrado y no hay .env.docker.example como base."
        exit 1
    fi
fi
ok ".env.docker encontrado"

# =============================================================================
# 3. Detectar si es primera vez (imagen no existe o volumen vendor vacío)
# =============================================================================
step "Detectando estado del entorno..."

IMAGE_EXISTS=$(docker images -q "$APP_IMAGE" 2>/dev/null)
VENDOR_EXISTS=$(docker volume ls -q | grep -x "$VENDOR_VOLUME" || true)
NODE_EXISTS=$(docker volume ls -q | grep -x "$NODE_VOLUME" || true)

FIRST_TIME=false

if [ -z "$IMAGE_EXISTS" ]; then
    warn "Imagen '$APP_IMAGE' no encontrada → se construirá desde cero"
    FIRST_TIME=true
elif [ -z "$VENDOR_EXISTS" ]; then
    warn "Volumen vendor '$VENDOR_VOLUME' no encontrado → se instalarán dependencias PHP"
    FIRST_TIME=true
elif [ -z "$NODE_EXISTS" ]; then
    warn "Volumen node_modules '$NODE_VOLUME' no encontrado → se instalarán dependencias Node"
    FIRST_TIME=true
else
    ok "Imágenes y volúmenes encontrados → usando entorno existente"
fi

# =============================================================================
# 4. Primera vez: build + dependencias
# =============================================================================
if [ "$FIRST_TIME" = true ]; then
    step "Primera vez detectada — construyendo entorno completo..."

    # 4a. Build de imágenes
    log "Construyendo imágenes Docker (esto puede tardar varios minutos)..."
    $COMPOSE build --parallel
    ok "Imágenes construidas"

    # 4b. Levantar solo pgsql y redis primero (necesarios para migraciones)
    log "Iniciando base de datos y Redis..."
    $COMPOSE up -d pgsql redis
    log "Esperando que PostgreSQL esté listo..."
    until $COMPOSE exec -T pgsql pg_isready -U "${DB_USERNAME:-contenflow}" > /dev/null 2>&1; do
        printf "."
        sleep 2
    done
    echo ""
    ok "PostgreSQL listo"

    # 4c. Levantar app para instalar dependencias
    log "Iniciando contenedor app..."
    $COMPOSE up -d app
    sleep 5

    # 4d. Instalar dependencias PHP
    log "Instalando dependencias PHP (composer install)..."
    # Arreglar git safe.directory (Windows bind mount causa "dubious ownership")
    $COMPOSE exec -T app git config --global --add safe.directory /var/www/html 2>/dev/null || true
    $COMPOSE exec -T app composer install --no-interaction --prefer-dist --optimize-autoloader
    ok "Dependencias PHP instaladas"

    # 4e. Generar APP_KEY si no existe
    APP_KEY_VALUE=$(grep "^APP_KEY=" .env.docker | cut -d'=' -f2)
    if [ -z "$APP_KEY_VALUE" ] || [ "$APP_KEY_VALUE" = "" ]; then
        log "Generando APP_KEY..."
        $COMPOSE exec -T app php artisan key:generate --env=docker
        ok "APP_KEY generada"
    fi

    # 4f. Ejecutar migraciones
    log "Ejecutando migraciones..."
    $COMPOSE exec -T app php artisan migrate --force --no-interaction
    ok "Migraciones ejecutadas"

    # 4g. Levantar todos los servicios
    log "Levantando todos los servicios..."
    $COMPOSE up -d

    # 4h. Instalar dependencias Node (en segundo plano, vite arranca solo)
    log "Instalando dependencias Node (npm install)..."
    $COMPOSE exec -T vite npm install --prefer-offline 2>/dev/null || \
    $COMPOSE exec -T vite npm install
    # Instalar chokidar en el contenedor app (necesario para octane --watch)
    $COMPOSE exec -T app npm install chokidar --prefix /var/www/html 2>/dev/null || true
    ok "Dependencias Node instaladas"

else
    # =============================================================================
    # 5. Entorno existente: simplemente levantar
    # =============================================================================
    step "Levantando servicios existentes..."
    $COMPOSE up -d
    ok "Servicios iniciados"
fi

# =============================================================================
# 6. Esperar a que la app responda (evita el ERR_EMPTY_RESPONSE)
# =============================================================================
step "Esperando que la aplicación esté lista..."

MAX_WAIT=120  # segundos máximos de espera
ELAPSED=0
INTERVAL=3

printf "   Esperando Octane"
while true; do
    # Intentar conectar directamente al contenedor app en puerto 8080
    STATUS=$(docker inspect --format='{{.State.Status}}' contentflow_app_dev 2>/dev/null || echo "missing")

    if [ "$STATUS" = "running" ]; then
        # Verificar que Octane responde directamente (sin pasar por nginx)
        HTTP_CODE=$(docker exec contentflow_app_dev \
            curl -s -o /dev/null -w "%{http_code}" \
            --max-time 3 \
            http://127.0.0.1:8080/api/health 2>/dev/null || echo "000")

        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
            echo ""
            ok "Octane responde (HTTP $HTTP_CODE)"
            break
        fi
    fi

    if [ $ELAPSED -ge $MAX_WAIT ]; then
        echo ""
        warn "Timeout esperando la app. Verificando logs..."
        echo ""
        $COMPOSE logs --tail=30 app
        echo ""
        warn "La app puede estar aún iniciando. Intenta http://localhost en unos segundos."
        break
    fi

    printf "."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

# =============================================================================
# 7. Estado final
# =============================================================================
step "Estado de servicios:"
$COMPOSE ps

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         ✅ Entorno listo                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}Aplicación:${NC}    http://localhost"
echo -e "  ${CYAN}Vite HMR:${NC}      http://localhost:5173"
echo -e "  ${CYAN}WebSockets:${NC}    ws://localhost:8081"
echo -e "  ${CYAN}Redis UI:${NC}      http://localhost:8082"
echo ""
echo -e "  ${YELLOW}Logs en tiempo real:${NC}"
echo -e "    docker-compose -f docker-compose.dev.yml logs -f app"
echo ""
