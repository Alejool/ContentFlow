#!/bin/bash

echo "==================================="
echo "Monitoring Scheduled Posts Deletion"
echo "==================================="
echo ""
echo "This will show logs related to:"
echo "- Social accounts processing"
echo "- Scheduled posts deletion"
echo "- Sync schedules operations"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "==================================="
echo ""

docker-compose exec app tail -f storage/logs/laravel.log | grep -E "(UpdatePublicationAction: Processing social accounts|SchedulingService::syncSchedules|Deleted.*scheduled posts|Clear flag detected)"
