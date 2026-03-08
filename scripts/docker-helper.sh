#!/bin/bash

# ContentFlow Docker Helper Script
# Facilita comandos comunes de Docker para desarrollo

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté corriendo
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker no está corriendo. Por favor inicia Docker Desktop."
        exit 1
    fi
}

# Mostrar ayuda
show_help() {
    cat << EOF
ContentFlow Docker Helper

Uso: ./docker-helper.sh [comando]

Comandos disponibles:

  Gestión de Servicios:
    start           Iniciar todos los servicios
    stop            Detener todos los servicios
    restart         Reiniciar servicios principales (app, queue, reverb)
    status          Ver estado de todos los servicios
    logs [servicio] Ver logs (opcional: especificar servicio)

  Desarrollo:
    shell           Abrir shell en el contenedor app
    artisan [cmd]   Ejecutar comando artisan
    composer [cmd]  Ejecutar comando composer
    npm [cmd]       Ejecutar comando npm en contenedor vite
    tinker          Abrir Laravel Tinker

  Base de Datos:
    migrate         Ejecutar migraciones
    fresh           Recrear base de datos con seeders (⚠️ DESTRUCTIVO)
    seed            Ejecutar seeders
    psql            Conectar a PostgreSQL
    backup          Crear backup de base de datos
    restore [file]  Restaurar backup de base de datos

  Caché y Optimización:
    clear           Limpiar todas las cachés
    optimize        Optimizar aplicación
    queue-restart   Reiniciar workers de cola

  Testing:
    test [filter]   Ejecutar tests (opcional: filtro)
    coverage        Ejecutar tests con coverage

  Mantenimiento:
    rebuild         Reconstruir imágenes Docker
    clean           Limpiar contenedores, volúmenes e imágenes no usadas
    reset           Reset completo (⚠️ MUY DESTRUCTIVO)
    fix-permissions Arreglar permisos de storage y cache

  Información:
    urls            Mostrar URLs de servicios
    health          Verificar salud de servicios
    help            Mostrar esta ayuda

Ejemplos:
  ./docker-helper.sh start
  ./docker-helper.sh artisan migrate
  ./docker-helper.sh logs app
  ./docker-helper.sh test --filter=UserTest

EOF
}

# Comandos
case "$1" in
    # Gestión de Servicios
    start)
        check_docker
        info "Iniciando servicios..."
        docker-compose up -d
        info "Servicios iniciados. Usa './docker-helper.sh status' para verificar."
        ;;

    stop)
        info "Deteniendo servicios..."
        docker-compose stop
        info "Servicios detenidos."
        ;;

    restart)
        info "Reiniciando servicios principales..."
        docker-compose restart app queue reverb
        info "Servicios reiniciados."
        ;;

    status)
        docker-compose ps
        ;;

    logs)
        if [ -z "$2" ]; then
            docker-compose logs -f
        else
            docker-compose logs -f "$2"
        fi
        ;;

    # Desarrollo
    shell)
        info "Abriendo shell en contenedor app..."
        docker-compose exec app sh
        ;;

    artisan)
        shift
        docker-compose exec app php artisan "$@"
        ;;

    composer)
        shift
        docker-compose exec app composer "$@"
        ;;

    npm)
        shift
        docker-compose exec vite npm "$@"
        ;;

    tinker)
        info "Abriendo Laravel Tinker..."
        docker-compose exec app php artisan tinker
        ;;

    # Base de Datos
    migrate)
        info "Ejecutando migraciones..."
        docker-compose exec app php artisan migrate
        ;;

    fresh)
        warn "⚠️  Esto BORRARÁ todos los datos de la base de datos!"
        read -p "¿Estás seguro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Recreando base de datos..."
            docker-compose exec app php artisan migrate:fresh --seed
            info "Base de datos recreada."
        else
            info "Operación cancelada."
        fi
        ;;

    seed)
        info "Ejecutando seeders..."
        docker-compose exec app php artisan db:seed
        ;;

    psql)
        info "Conectando a PostgreSQL..."
        docker-compose exec pgsql psql -U contenflow -d ContentFlow
        ;;

    backup)
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_FILE="backup_${TIMESTAMP}.sql"
        info "Creando backup: $BACKUP_FILE"
        docker-compose exec -T pgsql pg_dump -U contenflow ContentFlow > "$BACKUP_FILE"
        info "Backup creado: $BACKUP_FILE"
        ;;

    restore)
        if [ -z "$2" ]; then
            error "Debes especificar el archivo de backup"
            echo "Uso: ./docker-helper.sh restore <archivo.sql>"
            exit 1
        fi
        warn "⚠️  Esto SOBRESCRIBIRÁ la base de datos actual!"
        read -p "¿Estás seguro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Restaurando backup: $2"
            docker-compose exec -T pgsql psql -U contenflow ContentFlow < "$2"
            info "Backup restaurado."
        else
            info "Operación cancelada."
        fi
        ;;

    # Caché y Optimización
    clear)
        info "Limpiando cachés..."
        docker-compose exec app php artisan optimize:clear
        info "Cachés limpiadas."
        ;;

    optimize)
        info "Optimizando aplicación..."
        docker-compose exec app php artisan optimize
        docker-compose restart app
        info "Aplicación optimizada."
        ;;

    queue-restart)
        info "Reiniciando workers de cola..."
        docker-compose restart queue
        info "Workers reiniciados."
        ;;

    # Testing
    test)
        shift
        info "Ejecutando tests..."
        docker-compose exec app php artisan test "$@"
        ;;

    coverage)
        info "Ejecutando tests con coverage..."
        docker-compose exec app php artisan test --coverage
        ;;

    # Mantenimiento
    rebuild)
        info "Reconstruyendo imágenes..."
        docker-compose build --no-cache
        docker-compose up -d
        info "Imágenes reconstruidas."
        ;;

    clean)
        warn "Esto eliminará contenedores detenidos, volúmenes no usados e imágenes huérfanas."
        read -p "¿Continuar? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            info "Limpiando..."
            docker-compose down
            docker system prune -f
            docker volume prune -f
            info "Limpieza completada."
        else
            info "Operación cancelada."
        fi
        ;;

    reset)
        error "⚠️⚠️⚠️  RESET COMPLETO - BORRARÁ TODO ⚠️⚠️⚠️"
        warn "Esto eliminará:"
        warn "  - Todos los contenedores"
        warn "  - Todos los volúmenes (base de datos, Redis, etc.)"
        warn "  - Todas las imágenes"
        warn "  - Todas las cachés"
        echo
        read -p "¿ESTÁS COMPLETAMENTE SEGURO? Escribe 'RESET' para confirmar: " -r
        echo
        if [[ $REPLY == "RESET" ]]; then
            info "Ejecutando reset completo..."
            docker-compose down -v
            docker system prune -a -f
            docker volume prune -f
            info "Reconstruyendo desde cero..."
            docker-compose build --no-cache
            docker-compose up -d
            info "Instalando dependencias..."
            docker-compose exec app composer install
            docker-compose exec vite npm install
            info "Ejecutando migraciones..."
            docker-compose exec app php artisan migrate:fresh --seed
            info "Reset completo finalizado."
        else
            info "Operación cancelada."
        fi
        ;;

    fix-permissions)
        info "Arreglando permisos..."
        docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
        docker-compose exec app chmod -R 775 storage bootstrap/cache
        info "Permisos arreglados."
        ;;

    # Información
    urls)
        cat << EOF

📍 URLs de Servicios:

  Aplicación Web:      http://localhost
  Vite Dev Server:     http://localhost:5173
  Reverb WebSocket:    ws://localhost:8081
  Redis Commander:     http://localhost:8082

  PostgreSQL:          localhost:5432
  Redis:               localhost:6379

EOF
        ;;

    health)
        info "Verificando salud de servicios..."
        echo
        echo "Estado de contenedores:"
        docker-compose ps
        echo
        echo "Verificando PostgreSQL..."
        if docker-compose exec pgsql pg_isready -U contenflow > /dev/null 2>&1; then
            info "✓ PostgreSQL: OK"
        else
            error "✗ PostgreSQL: ERROR"
        fi
        echo "Verificando Redis..."
        if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
            info "✓ Redis: OK"
        else
            error "✗ Redis: ERROR"
        fi
        ;;

    help|--help|-h|"")
        show_help
        ;;

    *)
        error "Comando desconocido: $1"
        echo "Usa './docker-helper.sh help' para ver comandos disponibles."
        exit 1
        ;;
esac
