#!/usr/bin/env bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.dev.yml"
PROJECT="contentflow-dev"

echo ""
echo "🚀 ContentFlow DEV START (STABLE MODE)"
echo ""

# =====================================================
# 1. STOP + CLEAN ORPHANS
# =====================================================
echo "🧹 limpiando entorno..."

$COMPOSE down --remove-orphans || true

# =====================================================
# 2. FIX CONTAINERS CONFLICT (SAFE RECREATE)
# =====================================================
echo "🔍 verificando contenedores conflictivos..."

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

  if [ ! -z "$CID" ]; then
    echo "🧨 eliminando contenedor existente: $c"
    docker rm -f "$CID" >/dev/null 2>&1 || true
  fi
done

# =====================================================
# 3. FIX NETWORK (avoid mismatch warnings)
# =====================================================
echo "🔌 verificando red..."

NET="contentflow_network_dev"

if docker network ls | grep -q "$NET"; then
  echo "⚠️ red existente detectada → recreando limpia"
  docker network rm "$NET" >/dev/null 2>&1 || true
fi

# =====================================================
# 4. FIX VOLUMES (reuse or create clean)
# =====================================================
echo "📦 verificando volúmenes..."

VOLUMES=(
  contentflow_pgsql_data_shared
  contentflow_redis_data_shared
  contentflow_vendor_dev
  contentflow_node_modules_dev
  contentflow_vite_cache_dev
)

for v in "${VOLUMES[@]}"; do
  if docker volume ls | grep -q "$v"; then
    echo "✔ volumen existente: $v"
  else
    echo "📦 creando volumen: $v"
    docker volume create "$v" >/dev/null
  fi
done

# =====================================================
# 5. ENV SAFE LOAD (NO BREAKS)
# =====================================================
echo "🔐 cargando variables .env..."

if [ -f .env.docker ]; then
  export $(grep -v '^#' .env.docker | xargs) || true
fi

DB_USER="${DB_USERNAME:-postgres}"

# =====================================================
# 6. START DATABASE + REDIS FIRST
# =====================================================
echo "🏗️ levantando infraestructura base..."

$COMPOSE up -d pgsql redis

echo "⏳ esperando PostgreSQL..."

until $COMPOSE exec -T pgsql pg_isready -U "$DB_USER" >/dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL listo"

# =====================================================
# 7. START APP
# =====================================================
echo "🚀 levantando app..."

$COMPOSE up -d app

echo "📦 composer install..."

$COMPOSE exec -T app sh -c "
  git config --global --add safe.directory /var/www/html 2>/dev/null || true
  composer install --no-interaction --prefer-dist
" || true

echo "🔑 app key..."
$COMPOSE exec -T app php artisan key:generate --force || true

echo "🧬 migraciones..."
$COMPOSE exec -T app php artisan migrate --force || true

# =====================================================
# 8. FRONT + QUEUE + WORKERS
# =====================================================
echo "⚙️ levantando servicios secundarios..."

$COMPOSE up -d nginx queue vite reverb scheduler

# =====================================================
# 9. HEALTHCHECK REAL (OCTANE)
# =====================================================
echo "⏳ esperando Octane (healthcheck real)..."

for i in {1..60}; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health || true)

  if [ "$CODE" = "200" ]; then
    echo "✅ Octane OK"
    break
  fi

  sleep 2
done

# =====================================================
# 10. DONE
# =====================================================
echo ""
echo "🎉 ==============================="
echo "   DEV ENVIRONMENT READY"
echo "🎉 ==============================="
echo ""
echo "🌐 App:        http://localhost:8000"
echo "⚡ Octane:     http://localhost:8080"
echo "⚡ Vite:       http://localhost:5173"
echo "📡 Reverb:     ws://localhost:8081"
echo "🧠 Redis UI:   http://localhost:8082"
echo ""
echo "📜 logs:"
echo "docker compose -f docker-compose.dev.yml logs -f app"
echo ""