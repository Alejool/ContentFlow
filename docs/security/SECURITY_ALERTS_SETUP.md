# Security Alerts Configuration Guide

## Overview

ContentFlow includes a comprehensive security monitoring and alerting system that notifies administrators of suspicious activities in real-time. This guide covers setup, configuration, and best practices for security alerts.

## Alert Types

ContentFlow monitors and alerts on the following security events:

### 1. Failed Authentication Attempts
- Multiple failed login attempts from the same IP or user
- Potential brute force attacks
- Credential stuffing attempts

### 2. Rate Limit Violations
- Users repeatedly exceeding API rate limits
- Potential DoS attacks
- Automated bot activity

### 3. Suspicious File Uploads
- Attempts to upload executable files
- File type mismatches (magic bytes vs extension)
- Oversized files

### 4. Token Decryption Failures
- Failed decryption of social media tokens
- Potential encryption key compromise
- Database corruption

### 5. Dangerous Content Detection
- AI-generated content with malicious elements
- XSS attempts in content
- Suspicious URLs or scripts

### 6. Role Changes
- User role modifications
- Privilege escalation
- Admin account creation

### 7. Configuration Changes
- System configuration modifications
- Sensitive setting changes
- Environment variable updates

### 8. Critical Data Deletion
- Deletion of important records
- Bulk deletion operations
- User account deletions

### 9. 2FA Events
- 2FA disabled on admin accounts
- Multiple failed 2FA attempts
- Backup code usage

### 10. Unusual Access Patterns
- Access from new IP addresses
- Access from new countries
- Impossible travel (distant locations in short time)

## Quick Setup

### Step 1: Environment Configuration

Add to your `.env` file:

```env
# Security Alerts
SECURITY_ALERTS_ENABLED=true
SECURITY_ALERTS_MAIL_ENABLED=true
SECURITY_ALERTS_MAIL_RECIPIENTS=security@example.com,admin@example.com

# Optional: Slack Integration
SECURITY_ALERTS_SLACK_ENABLED=false
SECURITY_ALERTS_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional: Discord Integration
SECURITY_ALERTS_DISCORD_ENABLED=false
SECURITY_ALERTS_DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL

# Auto-blocking (use with caution)
SECURITY_AUTO_BLOCK_FAILED_AUTH=false
SECURITY_AUTO_BLOCK_RATE_LIMIT=false

# Testing Mode (alerts logged but not sent)
SECURITY_ALERTS_TESTING_MODE=false
```

### Step 2: Configure Alert Channels

Edit `config/security-alerts.php` to customize alert behavior:

```php
'failed_authentication' => [
    'enabled' => true,
    'threshold' => 5, // Alert after 5 failed attempts
    'window_minutes' => 15, // Within 15 minutes
    'severity' => 'high',
],
```

### Step 3: Test Alerts

```bash
# Send a test alert
php artisan security:test-alert

# Test specific alert type
php artisan security:test-alert --type=failed_authentication
```

## Alert Channels

### Email Alerts

**Setup**:
1. Configure mail settings in `.env`:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@contentflow.com
MAIL_FROM_NAME="${APP_NAME}"
```

2. Add recipients:
```env
SECURITY_ALERTS_MAIL_RECIPIENTS=security@example.com,admin@example.com,ops@example.com
```

**Email Format**:
```
Subject: [SECURITY ALERT - HIGH] Failed Authentication Attempts Detected

Alert Type: Failed Authentication
Severity: HIGH
Time: 2026-02-19 10:30:00 UTC

Details:
- User: user@example.com
- IP Address: 192.168.1.100
- Failed Attempts: 5
- Time Window: 15 minutes
- User Agent: Mozilla/5.0...

Action Required:
Review the audit logs and consider blocking this IP address if the activity continues.

View Audit Logs: https://contentflow.com/admin/audit-logs?ip=192.168.1.100
```

### Slack Alerts

**Setup**:
1. Create a Slack webhook:
   - Go to https://api.slack.com/apps
   - Create a new app or select existing
   - Enable "Incoming Webhooks"
   - Create a webhook for your channel
   - Copy the webhook URL

2. Configure in `.env`:
```env
SECURITY_ALERTS_SLACK_ENABLED=true
SECURITY_ALERTS_SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Slack Message Format**:
```
🚨 SECURITY ALERT - HIGH

*Failed Authentication Attempts Detected*

• User: user@example.com
• IP: 192.168.1.100
• Attempts: 5 in 15 minutes
• Time: 2026-02-19 10:30:00 UTC

<https://contentflow.com/admin/audit-logs?ip=192.168.1.100|View Audit Logs>
```

### Discord Alerts

**Setup**:
1. Create a Discord webhook:
   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Choose channel and copy webhook URL

2. Configure in `.env`:
```env
SECURITY_ALERTS_DISCORD_ENABLED=true
SECURITY_ALERTS_DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL
```

**Discord Message Format**:
```
🚨 **SECURITY ALERT - HIGH**

**Failed Authentication Attempts Detected**

**User:** user@example.com
**IP:** 192.168.1.100
**Attempts:** 5 in 15 minutes
**Time:** 2026-02-19 10:30:00 UTC

[View Audit Logs](https://contentflow.com/admin/audit-logs?ip=192.168.1.100)
```

### Database Logging

All alerts are automatically logged to the database in the `security_alerts` table.

**Query alerts**:
```php
use App\Models\SecurityAlert;

// Recent critical alerts
$alerts = SecurityAlert::where('severity', 'critical')
    ->where('created_at', '>', now()->subDays(7))
    ->get();

// Alerts by type
$authAlerts = SecurityAlert::where('type', 'failed_authentication')
    ->orderBy('created_at', 'desc')
    ->get();
```

### File Logging

Alerts are also logged to `storage/logs/security.log`.

**View logs**:
```bash
tail -f storage/logs/security.log
```

## Alert Configuration

### Threshold Configuration

Adjust thresholds based on your security requirements:

```php
// config/security-alerts.php

'failed_authentication' => [
    'threshold' => 5, // Lower = more sensitive
    'window_minutes' => 15, // Shorter = more sensitive
],

'rate_limit_violations' => [
    'threshold' => 10,
    'window_minutes' => 60,
],
```

**Recommendations**:
- **High security**: Lower thresholds (3-5 attempts)
- **Standard**: Medium thresholds (5-10 attempts)
- **High traffic**: Higher thresholds (10-20 attempts)

### Severity Levels

Configure what each severity means:

```php
'severity_levels' => [
    'critical' => [
        'description' => 'Immediate action required',
        'color' => '#FF0000',
        'emoji' => '🚨',
    ],
    'high' => [
        'description' => 'Urgent attention needed',
        'color' => '#FF6B00',
        'emoji' => '⚠️',
    ],
    'medium' => [
        'description' => 'Should be reviewed soon',
        'color' => '#FFD700',
        'emoji' => '⚡',
    ],
    'low' => [
        'description' => 'Informational',
        'color' => '#00FF00',
        'emoji' => 'ℹ️',
    ],
],
```

### Alert Throttling

Prevent alert spam:

```php
'throttling' => [
    'enabled' => true,
    'max_alerts_per_hour' => 10, // Max alerts per type per hour
    'cooldown_minutes' => 60, // Wait before sending same alert again
],
```

## Auto-Blocking

ContentFlow can automatically block suspicious IPs.

**⚠️ Warning**: Use with caution! Auto-blocking can lock out legitimate users.

### Enable Auto-Blocking

```env
SECURITY_AUTO_BLOCK_FAILED_AUTH=true
SECURITY_AUTO_BLOCK_RATE_LIMIT=true
```

### Configure Block Duration

```php
'failed_authentication' => [
    'auto_block' => true,
    'block_duration_minutes' => 30, // Block for 30 minutes
],
```

### Whitelist IPs

Prevent blocking of trusted IPs:

```php
// config/security-alerts.php
'whitelist' => [
    '192.168.1.1', // Office IP
    '10.0.0.0/8', // Internal network
],
```

### Unblock IPs

```bash
# Unblock specific IP
php artisan security:unblock 192.168.1.100

# List blocked IPs
php artisan security:blocked-list

# Clear all blocks
php artisan security:unblock --all
```

## Response Procedures

### Critical Alerts

**Immediate actions**:
1. Review the alert details
2. Check audit logs for context
3. Verify if it's a false positive
4. Block the IP if confirmed malicious
5. Investigate the scope of the incident
6. Document the response

### High Severity Alerts

**Within 1 hour**:
1. Review alert details
2. Check for patterns
3. Investigate user account
4. Consider temporary restrictions
5. Monitor for continued activity

### Medium/Low Severity Alerts

**Within 24 hours**:
1. Review during regular security review
2. Look for patterns over time
3. Adjust thresholds if needed
4. Document findings

## Integration with Monitoring Tools

### Datadog

```php
// In app/Listeners/SecurityAlertListener.php
use DataDog\DogStatsd;

public function handle(SecurityAlertEvent $event)
{
    $statsd = new DogStatsd();
    $statsd->increment('security.alert', 1, [
        'type' => $event->type,
        'severity' => $event->severity,
    ]);
}
```

### Sentry

```php
use Sentry\Laravel\Integration;

public function handle(SecurityAlertEvent $event)
{
    if ($event->severity === 'critical') {
        Sentry\captureMessage('Security Alert: ' . $event->type, [
            'level' => 'error',
            'extra' => $event->details,
        ]);
    }
}
```

### PagerDuty

```php
use PagerDuty\Client;

public function handle(SecurityAlertEvent $event)
{
    if (in_array($event->severity, ['critical', 'high'])) {
        $client = new Client(config('services.pagerduty.api_key'));
        $client->trigger([
            'routing_key' => config('services.pagerduty.routing_key'),
            'event_action' => 'trigger',
            'payload' => [
                'summary' => $event->title,
                'severity' => $event->severity,
                'source' => 'ContentFlow',
            ],
        ]);
    }
}
```

## Testing

### Test Individual Alerts

```bash
# Test failed authentication alert
php artisan security:test-alert --type=failed_authentication

# Test with custom parameters
php artisan security:test-alert --type=rate_limit --severity=high
```

### Simulate Security Events

```bash
# Simulate failed login attempts
php artisan security:simulate failed-auth --count=10

# Simulate rate limit violations
php artisan security:simulate rate-limit --count=20
```

### Testing Mode

Enable testing mode to log alerts without sending:

```env
SECURITY_ALERTS_TESTING_MODE=true
```

All alerts will be logged but not sent to external channels.

## Best Practices

### Alert Management

1. **Review alerts daily**: Check for patterns and trends
2. **Tune thresholds**: Adjust based on false positive rate
3. **Document responses**: Keep records of how alerts were handled
4. **Regular testing**: Test alert system monthly
5. **Update contacts**: Keep recipient lists current

### Security

1. **Protect webhook URLs**: Never commit to version control
2. **Use HTTPS**: Always use secure connections
3. **Rotate webhooks**: Change webhook URLs periodically
4. **Limit recipients**: Only send to authorized personnel
5. **Encrypt sensitive data**: Don't include passwords in alerts

### Performance

1. **Use queues**: Process alerts asynchronously
2. **Batch alerts**: Group similar alerts
3. **Cache checks**: Cache threshold checks
4. **Optimize queries**: Index alert-related database queries
5. **Monitor overhead**: Track alert system performance

## Troubleshooting

### Alerts Not Sending

**Check configuration**:
```bash
php artisan config:clear
php artisan config:cache
```

**Test mail configuration**:
```bash
php artisan tinker
Mail::raw('Test', function($msg) { $msg->to('test@example.com')->subject('Test'); });
```

**Check logs**:
```bash
tail -f storage/logs/laravel.log
```

### Too Many Alerts

**Increase thresholds**:
```php
'failed_authentication' => [
    'threshold' => 10, // Increase from 5
],
```

**Enable throttling**:
```php
'throttling' => [
    'enabled' => true,
    'max_alerts_per_hour' => 5,
],
```

### False Positives

**Whitelist IPs**:
```php
'whitelist' => [
    '192.168.1.100', // Known good IP
],
```

**Adjust time windows**:
```php
'window_minutes' => 30, // Increase from 15
```

## Support

For additional help:
- Review [Security Documentation](SECURITY_OVERVIEW.md)
- Check [Audit Logs](SECURITY_AUDIT_BACKUP.md)
- Contact security team
- Review Laravel notification documentation

---

**Last Updated**: 2026-02-19
**Version**: 1.0
