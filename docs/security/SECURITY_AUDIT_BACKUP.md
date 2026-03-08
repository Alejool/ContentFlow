# Audit Log Backup and Retention Guide

## Overview

ContentFlow maintains comprehensive audit logs for all critical security events. This guide covers backup procedures, retention policies, and compliance considerations for audit logs.

## Why Backup Audit Logs?

Audit logs are critical for:

- **Security investigations**: Trace unauthorized access attempts
- **Compliance requirements**: Meet regulatory obligations (GDPR, HIPAA, PCI-DSS)
- **Forensic analysis**: Investigate security incidents
- **Legal evidence**: Provide proof of actions in legal proceedings
- **Operational insights**: Understand system usage patterns

## What Gets Logged?

ContentFlow logs the following critical events:

### Authentication Events
- Successful logins
- Failed login attempts
- 2FA setup and verification
- Password changes
- Account lockouts

### Authorization Events
- Role changes
- Permission modifications
- Access to restricted resources

### Data Events
- Configuration changes
- Critical data deletion
- Social token access
- User data modifications

### Security Events
- Rate limit violations
- Suspicious file uploads
- Content sanitization triggers
- Token decryption failures

## Log Structure

Each audit log entry contains:

```json
{
  "id": 12345,
  "user_id": 42,
  "action": "role_changed",
  "auditable_type": "App\\Models\\User",
  "auditable_id": 42,
  "old_values": {"role": "user"},
  "new_values": {"role": "admin"},
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "metadata": {"changed_by": "admin@example.com"},
  "created_at": "2026-02-19T10:30:00Z"
}
```

## Retention Policy

### Default Retention

- **Minimum retention**: 90 days
- **Recommended retention**: 1 year
- **Compliance retention**: As required by regulations (often 7 years)

### Automatic Cleanup

Logs older than the retention period are automatically cleaned:

```bash
# Runs daily at 2 AM (configured in app/Console/Kernel.php)
php artisan audit:clean
```

**Configuration**: Edit retention period in `config/audit.php`:

```php
return [
    'retention_days' => 365, // Keep logs for 1 year
];
```

## Backup Strategies

### Strategy 1: Database Backup (Included)

Audit logs are included in regular database backups.

**Pros**:
- Simple setup
- Integrated with existing backup system
- Easy restoration

**Cons**:
- Large database size
- Slower backups
- Not optimized for long-term storage

**Setup**:
```bash
# Configure in config/backup.php
'backup' => [
    'include' => [
        'audit_logs' => true,
    ],
],
```

### Strategy 2: Separate Audit Log Backup (Recommended)

Export audit logs to separate storage for long-term retention.

**Pros**:
- Optimized for compliance
- Smaller main database
- Faster regular backups
- Immutable storage options

**Cons**:
- Additional setup required
- Separate restoration process

**Setup**:

1. **Create backup command**:

```bash
php artisan make:command BackupAuditLogs
```

2. **Implement backup logic** (see implementation below)

3. **Schedule backups**:

```php
// In app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    // Daily backup at 3 AM
    $schedule->command('audit:backup')
        ->daily()
        ->at('03:00');
}
```

### Strategy 3: Real-time Export

Stream audit logs to external systems in real-time.

**Pros**:
- Immediate availability
- No backup lag
- Immutable by design

**Cons**:
- More complex setup
- Requires external service
- Potential data loss if service unavailable

**Options**:
- AWS CloudWatch Logs
- Elasticsearch
- Splunk
- Datadog
- Syslog server

## Backup Implementation

### Daily Backup Command

Create `app/Console/Commands/BackupAuditLogs.php`:

```php
<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupAuditLogs extends Command
{
    protected $signature = 'audit:backup {--days=1 : Number of days to backup}';
    protected $description = 'Backup audit logs to external storage';

    public function handle(): int
    {
        $days = $this->option('days');
        $startDate = Carbon::now()->subDays($days);
        
        $this->info("Backing up audit logs from {$startDate->toDateString()}...");
        
        // Fetch logs
        $logs = AuditLog::where('created_at', '>=', $startDate)
            ->orderBy('created_at')
            ->get();
        
        if ($logs->isEmpty()) {
            $this->info('No logs to backup.');
            return 0;
        }
        
        // Create backup file
        $filename = 'audit-logs-' . $startDate->format('Y-m-d') . '.json';
        $content = $logs->toJson(JSON_PRETTY_PRINT);
        
        // Store in S3 or local storage
        Storage::disk('audit-backups')->put($filename, $content);
        
        $this->info("Backed up {$logs->count()} logs to {$filename}");
        
        // Optional: Compress for long-term storage
        if ($days > 30) {
            $this->compressBackup($filename);
        }
        
        return 0;
    }
    
    private function compressBackup(string $filename): void
    {
        $disk = Storage::disk('audit-backups');
        $content = $disk->get($filename);
        
        $compressed = gzencode($content, 9);
        $compressedFilename = $filename . '.gz';
        
        $disk->put($compressedFilename, $compressed);
        $disk->delete($filename);
        
        $this->info("Compressed to {$compressedFilename}");
    }
}
```

### Storage Configuration

Configure backup storage in `config/filesystems.php`:

```php
'disks' => [
    'audit-backups' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_AUDIT_BUCKET'),
        'url' => env('AWS_URL'),
        'endpoint' => env('AWS_ENDPOINT'),
        'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
        'throw' => false,
    ],
],
```

### Environment Variables

Add to `.env`:

```env
# Audit Log Backup Configuration
AWS_AUDIT_BUCKET=contentflow-audit-logs
AUDIT_RETENTION_DAYS=365
AUDIT_BACKUP_ENABLED=true
```

## Restoration Procedures

### Restore from Database Backup

If audit logs are included in database backups:

```bash
# Restore entire database
pg_restore -d contentflow backup_file.dump

# Or restore only audit_logs table
pg_restore -d contentflow -t audit_logs backup_file.dump
```

### Restore from Separate Backup

```bash
php artisan audit:restore audit-logs-2026-02-19.json
```

**Implementation** of `audit:restore` command:

```php
<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class RestoreAuditLogs extends Command
{
    protected $signature = 'audit:restore {file : Backup file to restore}';
    protected $description = 'Restore audit logs from backup file';

    public function handle(): int
    {
        $filename = $this->argument('file');
        
        if (!Storage::disk('audit-backups')->exists($filename)) {
            $this->error("Backup file not found: {$filename}");
            return 1;
        }
        
        $this->info("Restoring audit logs from {$filename}...");
        
        // Handle compressed files
        if (str_ends_with($filename, '.gz')) {
            $content = gzdecode(Storage::disk('audit-backups')->get($filename));
        } else {
            $content = Storage::disk('audit-backups')->get($filename);
        }
        
        $logs = json_decode($content, true);
        
        if (!$logs) {
            $this->error('Invalid backup file format.');
            return 1;
        }
        
        $this->info("Found {$count} logs to restore.");
        
        DB::transaction(function () use ($logs) {
            foreach ($logs as $log) {
                AuditLog::create($log);
            }
        });
        
        $this->info('Audit logs restored successfully.');
        
        return 0;
    }
}
```

## Compliance Configurations

### GDPR Compliance

```php
// config/audit.php
return [
    'retention_days' => 365,
    'anonymize_after_days' => 90, // Anonymize user data after 90 days
    'allow_user_data_export' => true,
    'allow_user_data_deletion' => true,
];
```

**Anonymization command**:

```bash
php artisan audit:anonymize --days=90
```

### HIPAA Compliance

```php
// config/audit.php
return [
    'retention_days' => 2555, // 7 years
    'encryption_required' => true,
    'immutable_storage' => true,
    'access_logging' => true,
];
```

### PCI-DSS Compliance

```php
// config/audit.php
return [
    'retention_days' => 365,
    'log_all_access' => true,
    'log_failed_access' => true,
    'quarterly_review_required' => true,
];
```

## Monitoring and Alerts

### Backup Failure Alerts

Configure alerts for backup failures:

```php
// In app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->command('audit:backup')
        ->daily()
        ->at('03:00')
        ->emailOutputOnFailure('security@example.com')
        ->pingOnFailure('https://healthchecks.io/ping/audit-backup');
}
```

### Storage Monitoring

Monitor backup storage usage:

```bash
php artisan audit:storage-check
```

**Implementation**:

```php
public function handle(): int
{
    $disk = Storage::disk('audit-backups');
    $files = $disk->allFiles();
    
    $totalSize = 0;
    foreach ($files as $file) {
        $totalSize += $disk->size($file);
    }
    
    $totalSizeGB = round($totalSize / 1024 / 1024 / 1024, 2);
    
    $this->info("Total backup storage: {$totalSizeGB} GB");
    $this->info("Total files: " . count($files));
    
    // Alert if storage exceeds threshold
    if ($totalSizeGB > 100) {
        $this->warn('Backup storage exceeds 100 GB!');
        // Send alert
    }
    
    return 0;
}
```

## Query and Analysis

### Query Audit Logs

```php
// Find all actions by a specific user
$logs = AuditLog::byUser($userId)
    ->orderBy('created_at', 'desc')
    ->get();

// Find all failed login attempts
$failedLogins = AuditLog::where('action', 'authentication_failed')
    ->byDateRange(Carbon::now()->subDays(7), Carbon::now())
    ->get();

// Find all role changes
$roleChanges = AuditLog::where('action', 'role_changed')
    ->with('user')
    ->get();

// Find suspicious activity from an IP
$suspicious = AuditLog::byIp('192.168.1.100')
    ->whereIn('action', ['authentication_failed', 'rate_limit_exceeded'])
    ->get();
```

### Export for Analysis

```bash
# Export to CSV
php artisan audit:export --format=csv --output=audit-report.csv

# Export specific date range
php artisan audit:export --from=2026-01-01 --to=2026-02-19 --format=json
```

## Best Practices

### Security

1. **Encrypt backups**: Use encryption for backup files
2. **Restrict access**: Limit who can access audit logs
3. **Immutable storage**: Use write-once storage when possible
4. **Separate storage**: Store backups separately from main database
5. **Access logging**: Log all access to audit logs

### Performance

1. **Index properly**: Ensure audit_logs table has proper indexes
2. **Archive old logs**: Move old logs to cold storage
3. **Partition tables**: Use table partitioning for large datasets
4. **Async logging**: Use queues for audit log creation

### Operational

1. **Test restoration**: Regularly test backup restoration
2. **Monitor storage**: Track backup storage usage
3. **Automate cleanup**: Automatically remove old backups
4. **Document procedures**: Keep documentation up to date
5. **Regular audits**: Review audit logs regularly

## Troubleshooting

### Backup Failures

**Check disk space**:
```bash
df -h
```

**Check permissions**:
```bash
ls -la storage/logs/
```

**Check S3 credentials**:
```bash
php artisan tinker
Storage::disk('audit-backups')->exists('test.txt');
```

### Large Backup Files

**Compress backups**:
```bash
php artisan audit:backup --compress
```

**Split by date**:
```bash
php artisan audit:backup --split-by-month
```

### Slow Queries

**Add indexes**:
```sql
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address);
```

## Support

For additional help:
- Review [Security Documentation](SECURITY_OVERVIEW.md)
- Check [Key Rotation Guide](SECURITY_KEY_ROTATION.md)
- Contact security team
- Review compliance requirements

---

**Last Updated**: 2026-02-19
**Version**: 1.0
**Next Review**: 2026-05-19
