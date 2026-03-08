@echo off
echo ===================================
echo Monitoring Scheduled Posts Deletion
echo ===================================
echo.
echo This will show logs related to:
echo - Social accounts processing
echo - Scheduled posts deletion
echo - Sync schedules operations
echo.
echo Press Ctrl+C to stop
echo.
echo ===================================
echo.

docker-compose exec app tail -f storage/logs/laravel.log
