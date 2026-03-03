#!/bin/bash

# Script de verificación para el fix de cambio de cuentas
# Este script verifica que todos los archivos necesarios existan y estén correctos

echo "🔍 Verificando fix de cambio de cuentas..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 - NO ENCONTRADO"
        ((ERRORS++))
    fi
}

# Función para verificar contenido en archivo
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $1 contiene: $2"
    else
        echo -e "${RED}✗${NC} $1 NO contiene: $2"
        ((ERRORS++))
    fi
}

echo "📁 Verificando archivos modificados..."
check_file "app/Models/Publications/Publication.php"
check_file "app/Services/Publish/PlatformPublishService.php"

echo ""
echo "📁 Verificando archivos nuevos..."
check_file "database/migrations/2026_03_03_000001_add_account_tracking_indexes_to_social_post_logs.php"
check_file "resources/js/Components/Content/modals/common/AccountSwitchingWarning.tsx"
check_file "ACCOUNT_SWITCHING_FIX.md"
check_file "FRONTEND_INTEGRATION_EXAMPLE.md"
check_file "RESUMEN_CAMBIOS.md"

echo ""
echo "🔍 Verificando contenido crítico..."
check_content "app/Models/Publications/Publication.php" "is_current_account"
check_content "app/Models/Publications/Publication.php" "can_unpublish"
check_content "app/Models/Publications/Publication.php" "canPublishToPlatform"
check_content "app/Services/Publish/PlatformPublishService.php" "alreadyPublishedAccountIds"
check_content "app/Services/Publish/PlatformPublishService.php" "invalid_accounts"

echo ""
echo "📊 Resumen:"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Todos los archivos y contenidos verificados correctamente${NC}"
    echo ""
    echo "📝 Próximos pasos:"
    echo "1. Ejecutar: php artisan migrate"
    echo "2. Integrar componente AccountSwitchingWarning en frontend"
    echo "3. Actualizar traducciones"
    echo "4. Realizar testing manual"
    exit 0
else
    echo -e "${RED}✗ Se encontraron $ERRORS errores${NC}"
    echo ""
    echo "Por favor, revisa los archivos faltantes o con contenido incorrecto"
    exit 1
fi
