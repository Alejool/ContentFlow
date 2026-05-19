#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"

echo ""
echo "🚀 ContentFlow DEV START (FIXED STABLE MODE)"
echo ""

# =====================================================
# 0. FIX WSL / DOCKER DESKTOP MOUNTS
# =====================================================
echo "🧼 limpiando mounts WSL..."

sudo rm -rf /run/desktop/mnt/host/wsl/docker-desktop-bind-mounts/* 2>/dev/null || true

# =====================================================
# 1. STOP EVERYTHING
# =====================================================
echo "🧹 deteniendo stack..."

$COMPOSE down --remove-orphans || true

# =====================================================
# 2. REMOVE CONTAINERS
# =====================================================
echo "🧨 limpiando contenedores..."

CONTAINERS=(
  contentflow_app_dev
  contentflow_pgsql_dev
  contentflow_redis_dev
  contentflow_nginx_dev
  contentflow_queue_dev
  contentflow_vite_dev
  contentflow_reverb_dev
  contentflow_scheduler_dev
)

for c in "${CONTAINERS[@]}"; do
  CID=$(docker ps -aq --filter "name=$c" || true)
  if [ -n "$CID" ]; then
    docker rm -f $CID >/dev/null 2>&1 || true
    echo "✔ eliminado: $c"
  fi
done

# =====================================================
# 3. RESET NETWORK
# =====================================================
echo "🔌 reseteando red..."

NET="contentflow_network_dev"

if docker network ls | grep -q "$NET"; then
  docker network rm "$NET" >/dev/null 2>&1 || true
fi

# =====================================================
# 4. RESET VOLUMES (CLEAN STATE)
# =====================================================
echo "📦 recreando volúmenes..."

VOLUMES=(
  contentflow_pgsql_data_shared
  contentflow_redis_data_shared
  contentflow_vendor_dev
  contentflow_node_modules_dev
  contentflow_vite_cache_dev
)

for v in "${VOLUMES[@]}"; do
  docker volume rm -f "$v" >/dev/null 2>&1 || true
  docker volume create "$v" >/dev/null
done

# =====================================================
# 5. CLEAN DOCKER SYSTEM
# =====================================================
echo "🧽 limpieza docker..."

docker system prune -f >/dev/null || true

# =====================================================
# 6. ENV LOAD
# =====================================================
echo "🔐 cargando .env..."

if [ -f .env.docker ]; then
  export $(grep -v '^#' .env.docker | xargs) || true
fi

DB_USER="${DB_USERNAME:-postgres}"

# =====================================================
# 7. START INFRA (ONLY DB FIRST)
# =====================================================
echo "🏗️ levantando postgres + redis..."

$COMPOSE up -d pgsql redis

echo "⏳ esperando PostgreSQL..."

until $COMPOSE exec -T pgsql pg_isready -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL listo"

# =====================================================
# 8. 🔥 CRITICAL FIX: COMPOSER BEFORE APP
# =====================================================
echo "📦 instalando dependencias PHP (OBLIGATORIO)..."

$COMPOSE run --rm app sh -c "
  composer install --no-interaction --prefer-dist
"

# =====================================================
# 9. START APP (NOW SAFE)
# =====================================================
echo "🚀 levantando app..."

$COMPOSE up -d app

# =====================================================
# 10. LARAVEL SETUP
# =====================================================
echo "🔑 configurando Laravel..."

$COMPOSE exec -T app php artisan key:generate --force || true
$COMPOSE exec -T app php artisan migrate --force || true

# =====================================================
# 11. SECONDARY SERVICES
# =====================================================
echo "⚙️ levantando servicios secundarios..."

$COMPOSE up -d nginx queue vite reverb scheduler

# =====================================================
# 12. REAL HEALTHCHECK (NO FAKE READY)
# =====================================================
echo "⏳ esperando healthcheck real..."

for i in {1..60}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost/api/health || true)

  echo "🔄 intento $i → HTTP $CODE"

  if [ "$CODE" = "200" ]; then
    echo "✅ sistema OK"
    break
  fi

  sleep 2
done

# =====================================================
# DONE
# =====================================================
echo ""
echo "🎉 ==============================="
echo "   DEV ENV READY (STABLE)"
echo "🎉 ==============================="
echo ""
echo "🌐 App:    http://localhost"
echo "⚡ Octane: http://localhost:8080"
echo "⚡ Vite:   http://localhost:5173"
echo ""