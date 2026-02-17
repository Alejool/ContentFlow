#!/bin/bash

echo "🚀 ContentFlow - Iniciando entorno de desarrollo optimizado..."

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

# Limpiar caché de deployment
echo -e "${BLUE}🧹 Limpiando caché...${NC}"
docker-compose -f docker-compose.dev.yml exec -T app php artisan cache:forget last_deployment 2>/dev/null || true

# Levantar servicios
echo -e "${BLUE}🐳 Levantando servicios Docker...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando servicios...${NC}"
sleep 5

# Instalar dependencias si es necesario
echo -e "${BLUE}📦 Verificando dependencias...${NC}"
docker-compose -f docker-compose.dev.yml exec -T app composer install --no-interaction --prefer-dist 2>/dev/null || true

# Ejecutar migraciones
echo -e "${BLUE}🗄️  Ejecutando migraciones...${NC}"
docker-compose -f docker-compose.dev.yml exec -T app php artisan migrate --force 2>/dev/null || true

# Actualizar timestamp de deployment
docker-compose -f docker-compose.dev.yml exec -T app php artisan cache:put last_deployment $(date +%s) 3600

echo -e "${GREEN}✅ ContentFlow está listo!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🌐 Aplicación:${NC} http://localhost"
echo -e "${BLUE}🔥 Vite HMR:${NC} http://localhost:5173"
echo -e "${BLUE}💓 Health Check:${NC} http://localhost/api/health"
echo -e "${BLUE}🔌 Reverb:${NC} ws://localhost:8081"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📊 Ver logs:${NC} docker-compose -f docker-compose.dev.yml logs -f"
echo -e "${YELLOW}🛑 Detener:${NC} docker-compose -f docker-compose.dev.yml down"
