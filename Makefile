.PHONY: help up down restart status logs shell artisan composer npm tinker migrate fresh seed psql backup clear optimize test health urls

# Variables
COMPOSE = docker-compose
APP = app
VITE = vite
PGSQL = pgsql
QUEUE = queue
REVERB = reverb

# Colores para output (funciona en Git Bash)
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m

help: ## Mostrar esta ayuda
	@echo "Intellipost - Comandos Docker"
	@echo ""
	@echo "Uso: make [comando]"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Gestión de Servicios
up: ## Iniciar todos los servicios
	@echo "$(GREEN)Iniciando servicios...$(NC)"
	$(COMPOSE) up -d
	@echo "$(GREEN)Servicios iniciados. Usa 'make status' para verificar.$(NC)"

down: ## Detener todos los servicios
	@echo "$(YELLOW)Deteniendo servicios...$(NC)"
	$(COMPOSE) down

restart: ## Reiniciar servicios principales (app, queue, reverb)
	@echo "$(GREEN)Reiniciando servicios...$(NC)"
	$(COMPOSE) restart $(APP) $(QUEUE) $(REVERB)

status: ## Ver estado de servicios
	$(COMPOSE) ps

logs: ## Ver logs de todos los servicios (Ctrl+C para salir)
	$(COMPOSE) logs -f

logs-app: ## Ver logs del servicio app
	$(COMPOSE) logs -f $(APP)

logs-queue: ## Ver logs del servicio queue
	$(COMPOSE) logs -f $(QUEUE)

logs-reverb: ## Ver logs del servicio reverb
	$(COMPOSE) logs -f $(REVERB)

# Desarrollo
shell: ## Abrir shell en contenedor app
	$(COMPOSE) exec $(APP) sh

artisan: ## Ejecutar comando artisan (uso: make artisan cmd="migrate")
	$(COMPOSE) exec $(APP) php artisan $(cmd)

composer: ## Ejecutar comando composer (uso: make composer cmd="install")
	$(COMPOSE) exec $(APP) composer $(cmd)

npm: ## Ejecutar comando npm (uso: make npm cmd="install")
	$(COMPOSE) exec $(VITE) npm $(cmd)

tinker: ## Abrir Laravel Tinker
	$(COMPOSE) exec $(APP) php artisan tinker

# Base de Datos
migrate: ## Ejecutar migraciones
	@echo "$(GREEN)Ejecutando migraciones...$(NC)"
	$(COMPOSE) exec $(APP) php artisan migrate

fresh: ## Recrear base de datos con seeders (⚠️ DESTRUCTIVO)
	@echo "$(YELLOW)⚠️  Esto BORRARÁ todos los datos!$(NC)"
	@read -p "¿Continuar? [y/N]: " confirm && [ "$$confirm" = "y" ] || exit 1
	$(COMPOSE) exec $(APP) php artisan migrate:fresh --seed

seed: ## Ejecutar seeders
	$(COMPOSE) exec $(APP) php artisan db:seed

psql: ## Conectar a PostgreSQL
	$(COMPOSE) exec $(PGSQL) psql -U Intellipost -d Intellipost

backup: ## Crear backup de base de datos
	@echo "$(GREEN)Creando backup...$(NC)"
	$(COMPOSE) exec -T $(PGSQL) pg_dump -U Intellipost Intellipost > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup creado.$(NC)"

# Caché y Optimización
clear: ## Limpiar todas las cachés
	@echo "$(GREEN)Limpiando cachés...$(NC)"
	$(COMPOSE) exec $(APP) php artisan optimize:clear
	@echo "$(GREEN)Cachés limpiadas.$(NC)"

optimize: ## Optimizar aplicación
	@echo "$(GREEN)Optimizando...$(NC)"
	$(COMPOSE) exec $(APP) php artisan optimize
	$(COMPOSE) restart $(APP)

queue-restart: ## Reiniciar workers de cola
	$(COMPOSE) restart $(QUEUE)

# Testing
test: ## Ejecutar tests (uso: make test filter="UserTest")
	$(COMPOSE) exec $(APP) php artisan test $(if $(filter),--filter=$(filter),)

coverage: ## Ejecutar tests con coverage
	$(COMPOSE) exec $(APP) php artisan test --coverage

# Mantenimiento
rebuild: ## Reconstruir imágenes Docker
	@echo "$(GREEN)Reconstruyendo imágenes...$(NC)"
	$(COMPOSE) build --no-cache
	$(COMPOSE) up -d

clean: ## Limpiar contenedores y volúmenes no usados
	@echo "$(YELLOW)Limpiando recursos no usados...$(NC)"
	$(COMPOSE) down
	docker system prune -f
	docker volume prune -f

fix-permissions: ## Arreglar permisos de storage y cache
	@echo "$(GREEN)Arreglando permisos...$(NC)"
	$(COMPOSE) exec $(APP) chown -R www-data:www-data storage bootstrap/cache
	$(COMPOSE) exec $(APP) chmod -R 775 storage bootstrap/cache

# Información
urls: ## Mostrar URLs de servicios
	@echo ""
	@echo "📍 URLs de Servicios:"
	@echo ""
	@echo "  Aplicación Web:      http://localhost"
	@echo "  Vite Dev Server:     http://localhost:5173"
	@echo "  Reverb WebSocket:    ws://localhost:8081"
	@echo "  Redis Commander:     http://localhost:8082"
	@echo ""
	@echo "  PostgreSQL:          localhost:5432"
	@echo "  Redis:               localhost:6379"
	@echo ""

health: ## Verificar salud de servicios
	@echo "$(GREEN)Verificando servicios...$(NC)"
	@echo ""
	@echo "Estado de contenedores:"
	@$(COMPOSE) ps
	@echo ""
	@echo "PostgreSQL:"
	@$(COMPOSE) exec $(PGSQL) pg_isready -U Intellipost && echo "  ✓ OK" || echo "  ✗ ERROR"
	@echo "Redis:"
	@$(COMPOSE) exec redis redis-cli ping > /dev/null && echo "  ✓ OK" || echo "  ✗ ERROR"

# Comandos compuestos útiles
install: ## Instalar dependencias (composer + npm)
	@echo "$(GREEN)Instalando dependencias PHP...$(NC)"
	$(COMPOSE) exec $(APP) composer install
	@echo "$(GREEN)Instalando dependencias Node...$(NC)"
	$(COMPOSE) exec $(VITE) npm install

setup: ## Setup inicial del proyecto
	@echo "$(GREEN)Setup inicial...$(NC)"
	$(COMPOSE) up -d
	$(COMPOSE) exec $(APP) composer install
	$(COMPOSE) exec $(VITE) npm install
	$(COMPOSE) exec $(APP) php artisan key:generate
	$(COMPOSE) exec $(APP) php artisan migrate
	@echo "$(GREEN)Setup completado!$(NC)"
	@make urls

deploy: ## Deploy (optimizar + reiniciar)
	@echo "$(GREEN)Desplegando cambios...$(NC)"
	$(COMPOSE) exec $(APP) composer install --no-dev --optimize-autoloader
	$(COMPOSE) exec $(APP) php artisan migrate --force
	$(COMPOSE) exec $(APP) php artisan optimize
	$(COMPOSE) restart $(APP) $(QUEUE) $(REVERB)
	@echo "$(GREEN)Deploy completado!$(NC)"
