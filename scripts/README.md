# Scripts de Docker Helper

Este directorio contiene scripts útiles para facilitar el trabajo con Docker en el proyecto Intellipost.

## 📋 Scripts Disponibles

### docker-helper.sh
Script principal con 30+ comandos para gestionar el entorno Docker.

**Uso en Windows**:
```bash
# Con Git Bash (recomendado)
bash scripts/docker-helper.sh [comando]

# Con WSL
./scripts/docker-helper.sh [comando]
```

**Comandos principales**:
```bash
# Gestión de servicios
bash scripts/docker-helper.sh start
bash scripts/docker-helper.sh stop
bash scripts/docker-helper.sh restart
bash scripts/docker-helper.sh status
bash scripts/docker-helper.sh logs [servicio]

# Desarrollo
bash scripts/docker-helper.sh shell
bash scripts/docker-helper.sh artisan [comando]
bash scripts/docker-helper.sh composer [comando]
bash scripts/docker-helper.sh npm [comando]
bash scripts/docker-helper.sh tinker

# Base de datos
bash scripts/docker-helper.sh migrate
bash scripts/docker-helper.sh fresh
bash scripts/docker-helper.sh seed
bash scripts/docker-helper.sh psql
bash scripts/docker-helper.sh backup
bash scripts/docker-helper.sh restore [archivo]

# Caché y optimización
bash scripts/docker-helper.sh clear
bash scripts/docker-helper.sh optimize
bash scripts/docker-helper.sh queue-restart

# Testing
bash scripts/docker-helper.sh test [filtro]
bash scripts/docker-helper.sh coverage

# Mantenimiento
bash scripts/docker-helper.sh rebuild
bash scripts/docker-helper.sh clean
bash scripts/docker-helper.sh reset
bash scripts/docker-helper.sh fix-permissions

# Información
bash scripts/docker-helper.sh urls
bash scripts/docker-helper.sh health
bash scripts/docker-helper.sh help
```

## 🎯 Alternativa: Makefile

Si prefieres comandos más cortos, usa el Makefile en la raíz del proyecto:

```bash
# Requiere make instalado (viene con Git Bash)
make help          # Ver todos los comandos
make up            # Iniciar servicios
make logs          # Ver logs
make shell         # Abrir shell
make migrate       # Ejecutar migraciones
make test          # Ejecutar tests
make health        # Verificar salud
```

## 🔧 Instalación de Herramientas

### Git Bash (Windows)
Git Bash viene incluido con Git for Windows y proporciona un entorno bash completo.

**Descargar**: https://git-scm.com/download/win

### Make (Windows)
Make viene incluido con Git Bash. Para verificar:
```bash
make --version
```

Si no está disponible, instalar con Chocolatey:
```bash
choco install make
```

### WSL (Opcional)
Para una experiencia más nativa de Linux en Windows:
```bash
wsl --install
```

## 📝 Ejemplos de Uso

### Flujo de trabajo típico
```bash
# 1. Iniciar servicios
bash scripts/docker-helper.sh start

# 2. Ver logs si hay problemas
bash scripts/docker-helper.sh logs app

# 3. Ejecutar migraciones
bash scripts/docker-helper.sh migrate

# 4. Abrir Tinker para probar código
bash scripts/docker-helper.sh tinker

# 5. Ejecutar tests
bash scripts/docker-helper.sh test
```

### Después de pull de Git
```bash
# Actualizar dependencias y migrar
bash scripts/docker-helper.sh composer install
bash scripts/docker-helper.sh migrate
bash scripts/docker-helper.sh clear
bash scripts/docker-helper.sh restart
```

### Backup antes de cambios importantes
```bash
# Crear backup
bash scripts/docker-helper.sh backup

# Hacer cambios...

# Si algo sale mal, restaurar
bash scripts/docker-helper.sh restore backup_20260308_143022.sql
```

### Debugging de problemas
```bash
# Verificar salud de servicios
bash scripts/docker-helper.sh health

# Ver logs en tiempo real
bash scripts/docker-helper.sh logs app

# Abrir shell para investigar
bash scripts/docker-helper.sh shell

# Arreglar permisos si hay errores
bash scripts/docker-helper.sh fix-permissions
```

## 🚀 Scripts Futuros (Propuestos)

### backup.sh
Script automatizado para backups programados.

### restore.sh
Script para restaurar backups con validación.

### dev-watch.sh
Watcher para reiniciar Octane automáticamente en cambios.

### deploy.sh
Script de deployment automatizado.

##  Tips

1. **Alias útiles**: Agregar a tu `.bashrc` o `.bash_profile`:
   ```bash
   alias dh='bash scripts/docker-helper.sh'
   alias dh-start='bash scripts/docker-helper.sh start'
   alias dh-logs='bash scripts/docker-helper.sh logs'
   alias dh-shell='bash scripts/docker-helper.sh shell'
   ```

   Uso:
   ```bash
   dh start
   dh-logs app
   dh-shell
   ```

2. **Autocompletado**: Para bash, crear archivo de autocompletado:
   ```bash
   # ~/.bash_completion.d/docker-helper
   _docker_helper_completions() {
       local commands="start stop restart status logs shell artisan composer npm tinker migrate fresh seed psql backup restore clear optimize queue-restart test coverage rebuild clean reset fix-permissions urls health help"
       COMPREPLY=($(compgen -W "$commands" -- "${COMP_WORDS[1]}"))
   }
   complete -F _docker_helper_completions docker-helper.sh
   ```

3. **Variables de entorno**: Personalizar comportamiento:
   ```bash
   export DOCKER_HELPER_COMPOSE="docker-compose"
   export DOCKER_HELPER_APP="app"
   ```

## 📚 Documentación Relacionada

- `.kiro/steering/docker-environment.md` - Guía completa del entorno Docker
- `.kiro/steering/docker-optimizations.md` - Optimizaciones y mejoras
- `DOCKER_ANALYSIS.md` - Análisis completo del sistema
- `Makefile` - Comandos alternativos más cortos

## 🤝 Contribuir

Para agregar nuevos scripts o mejorar los existentes:

1. Seguir el formato del script existente
2. Agregar validaciones de seguridad para comandos destructivos
3. Incluir mensajes informativos con colores
4. Documentar en este README
5. Actualizar el comando `help` del script

## 📞 Soporte

Si encuentras problemas:
1. Verificar que Docker esté corriendo
2. Revisar logs: `bash scripts/docker-helper.sh logs`
3. Verificar salud: `bash scripts/docker-helper.sh health`
4. Consultar troubleshooting en `.kiro/steering/docker-environment.md`
