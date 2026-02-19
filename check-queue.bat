@echo off
echo Verificando estado de la cola...
echo.

echo 1. Estado del contenedor de cola:
docker ps | findstr contentflow_queue_prod
echo.

echo 2. Ultimos logs del worker:
docker logs --tail 20 contentflow_queue_prod
echo.

echo 3. Jobs en la cola default:
docker exec contentflow_redis_prod redis-cli LLEN queues:default
echo.

echo 4. Todas las colas en Redis:
docker exec contentflow_redis_prod redis-cli KEYS "queues:*"
echo.

echo 5. Procesar un job manualmente:
docker exec contentflow_queue_prod php artisan queue:work --once --queue=default
echo.

echo 6. Listar archivos en procesamiento:
docker exec contentflow_app_prod php artisan reels:list --status=processing
echo.

pause
