# Security Features Quick Reference

## Overview

Quick reference guide for Intellipost's security features. For detailed documentation, see the full guides linked in each section.

## Rate Limiting

**Purpose**: Prevent abuse and DoS attacks

**Configuration**: `config/rate-limits.php`

**Quick Setup**:
```php
'api.posts.store' => [
    'default' => 10,  // requests per minute
    'roles' => [
        'admin' => 100,
        'premium' => 50,
    ],
],
```

**Environment**:
```env
CACHE_DRIVER=redis  # Required for production
```

**Testing**:
```bash
# Make multiple requests to test
curl -X POST http://localhost/api/posts -H "Authorization: Bearer TOKEN"
```

**Documentation**: README.md → Security Features

---

## Two-Factor Authentication (2FA)

**Purpose**: Protect admin accounts

**Setup**: Automatic for admin users

**User Flow**:
1. Admin logs in → Redirected to 2FA setup
2. Scan QR code with authenticator app
3. Save backup codes
4. Enter verification code

**Recovery**: Use backup codes if device lost

**Admin Commands**:
```bash
# Disable 2FA for locked-out user
php artisan tinker
$user = User::where('email', 'user@example.com')->first();
$user->two_factor_secret = null;
$user->save();
```

**Documentation**: [docs/SECURITY_2FA_SETUP.md](SECURITY_2FA_SETUP.md)

---

## File Upload Security

**Purpose**: Prevent malicious file uploads

**Service**: `app/Services/FileValidatorService.php`

**Usage**:
```php
use App\Services\FileValidatorService;

$validator = new FileValidatorService();
$result = $validator->validate($file, ['image/jpeg', 'image/png']);

if (!$result->success) {
    return back()->withErrors(['file' => $result->message]);
}
```

**Features**:
- Magic byte validation
- Size limits per type
- Executable detection
- Security logging

**Documentation**: Design document

---

## Content Sanitization

**Purpose**: Prevent XSS and code injection

**Service**: `app/Services/ContentSanitizerService.php`

**Usage**:
```php
use App\Services\ContentSanitizerService;

$sanitizer = new ContentSanitizerService();
$result = $sanitizer->sanitize($aiGeneratedContent);

$cleanContent = $result->content;
if ($result->wasModified) {
    // Content was sanitized - check logs
}
```

**Features**:
- HTML Purifier integration
- Strict tag whitelist
- URL validation
- Security logging

**Documentation**: Design document

---

## Audit Logging

**Purpose**: Track all critical actions

**Model**: `app/Models/AuditLog.php`

**Query Examples**:
```php
// Recent actions by user
$logs = AuditLog::byUser($userId)
    ->orderBy('created_at', 'desc')
    ->get();

// Failed login attempts
$failed = AuditLog::where('action', 'authentication_failed')
    ->byDateRange(Carbon::now()->subDays(7), Carbon::now())
    ->get();

// Actions from specific IP
$suspicious = AuditLog::byIp('192.168.1.100')->get();
```

**Backup**:
```bash
# Daily backup
php artisan audit:backup

# Restore from backup
php artisan audit:restore audit-logs-2026-02-19.json
```

**Cleanup**:
```bash
# Clean logs older than retention period
php artisan audit:clean
```

**Documentation**: [docs/SECURITY_AUDIT_BACKUP.md](SECURITY_AUDIT_BACKUP.md)

---

## Token Encryption

**Purpose**: Protect OAuth tokens at rest

**Cast**: `app/Casts/EncryptedToken.php`

**Usage**:
```php
class SocialAccount extends Model
{
    protected $casts = [
        'access_token' => EncryptedToken::class,
        'refresh_token' => EncryptedToken::class,
    ];
}

// Automatic encryption/decryption
$token = $account->access_token;  // Decrypted automatically
$account->access_token = $newToken;  // Encrypted automatically
```

**Key Rotation**:
```bash
# Rotate encryption key
php artisan encryption:rotate

# Verify rotation
php artisan tinker
$account = SocialAccount::first();
echo $account->access_token ? "✓ Success" : "✗ Failed";
```

**Documentation**: [docs/SECURITY_KEY_ROTATION.md](SECURITY_KEY_ROTATION.md)

---

## Security Alerts

**Purpose**: Real-time threat detection

**Configuration**: `config/security-alerts.php`

**Environment**:
```env
SECURITY_ALERTS_ENABLED=true
SECURITY_ALERTS_MAIL_ENABLED=true
SECURITY_ALERTS_MAIL_RECIPIENTS=security@example.com

# Optional
SECURITY_ALERTS_SLACK_ENABLED=true
SECURITY_ALERTS_SLACK_WEBHOOK=https://hooks.slack.com/...
```

**Alert Types**:
- Failed authentication attempts
- Rate limit violations
- Suspicious file uploads
- Token decryption failures
- Dangerous content detection
- Role changes
- Configuration changes
- Critical data deletion
- 2FA events

**Testing**:
```bash
# Send test alert
php artisan security:test-alert

# Test specific type
php artisan security:test-alert --type=failed_authentication
```

**Auto-Blocking**:
```env
SECURITY_AUTO_BLOCK_FAILED_AUTH=true  # Use with caution
SECURITY_AUTO_BLOCK_RATE_LIMIT=true
```

**Unblock IP**:
```bash
php artisan security:unblock 192.168.1.100
```

**Documentation**: [docs/SECURITY_ALERTS_SETUP.md](SECURITY_ALERTS_SETUP.md)

---

## Common Tasks

### Enable 2FA for Admin

Automatic - admin users are redirected to setup on first login.

### Rotate Encryption Key

```bash
php artisan down
php artisan backup:run --only-db
php artisan encryption:rotate
php artisan up
```

### Review Security Logs

```bash
# View recent security events
tail -f storage/logs/security.log

# Query audit logs
php artisan tinker
AuditLog::where('created_at', '>', now()->subDays(7))->get();
```

### Block Suspicious IP

```bash
# Manual block
php artisan security:block 192.168.1.100 --duration=60

# Or enable auto-blocking in .env
SECURITY_AUTO_BLOCK_FAILED_AUTH=true
```

### Backup Audit Logs

```bash
# Manual backup
php artisan audit:backup

# Schedule in Kernel.php
$schedule->command('audit:backup')->daily()->at('03:00');
```

### Test Security Features

```bash
# Test rate limiting
for i in {1..20}; do curl http://localhost/api/endpoint; done

# Test 2FA
# Login as admin and follow setup flow

# Test file upload
curl -X POST -F "file=@malicious.exe" http://localhost/api/upload

# Test alerts
php artisan security:test-alert
```

---

## Emergency Procedures

### Security Breach Detected

1. **Contain**:
   ```bash
   php artisan down
   php artisan security:block <IP>
   ```

2. **Investigate**:
   ```bash
   tail -f storage/logs/security.log
   php artisan tinker
   AuditLog::where('ip_address', '<IP>')->get();
   ```

3. **Rotate Keys**:
   ```bash
   php artisan encryption:rotate
   php artisan key:generate
   ```

4. **Notify**:
   - Security team
   - Affected users
   - Authorities (if required)

### Lost Encryption Key

**Prevention**: Always backup `.env` files!

**If lost**: All encrypted data is permanently lost. Users must re-authenticate social accounts.

### Admin Locked Out

```bash
# Disable 2FA temporarily
php artisan tinker
$user = User::where('email', 'admin@example.com')->first();
$user->two_factor_secret = null;
$user->save();
```

### Database Compromised

1. **Immediate**:
   ```bash
   php artisan down
   # Change database password
   # Rotate APP_KEY
   php artisan encryption:rotate
   ```

2. **Notify users** to change passwords

3. **Review audit logs** for unauthorized access

4. **Restore from backup** if necessary

---

## Configuration Files

| File | Purpose |
|------|---------|
| `config/rate-limits.php` | Rate limiting configuration |
| `config/security-alerts.php` | Security alerts configuration |
| `config/audit.php` | Audit logging configuration |
| `.env` | Environment variables |
| `.env.security.example` | Security configuration template |

---

## Useful Commands

```bash
# Security
php artisan security:test-alert
php artisan security:block <IP>
php artisan security:unblock <IP>
php artisan security:blocked-list

# Audit Logs
php artisan audit:backup
php artisan audit:restore <file>
php artisan audit:clean
php artisan audit:export

# Encryption
php artisan encryption:rotate
php artisan key:generate

# 2FA
# (No commands - handled through UI)

# Maintenance
php artisan down
php artisan up
php artisan backup:run
```

---

## Monitoring Checklist

**Daily**:
- [ ] Review security alerts
- [ ] Check failed login attempts
- [ ] Monitor rate limit violations

**Weekly**:
- [ ] Review audit logs
- [ ] Check for suspicious patterns
- [ ] Verify backups are running

**Monthly**:
- [ ] Update dependencies
- [ ] Review access permissions
- [ ] Test backup restoration

**Quarterly**:
- [ ] Rotate encryption keys
- [ ] Security audit
- [ ] Penetration testing

---

## Support Resources

- **Full Documentation**: [docs/SECURITY_OVERVIEW.md](SECURITY_OVERVIEW.md)
- **2FA Setup**: [docs/SECURITY_2FA_SETUP.md](SECURITY_2FA_SETUP.md)
- **Key Rotation**: [docs/SECURITY_KEY_ROTATION.md](SECURITY_KEY_ROTATION.md)
- **Audit Backup**: [docs/SECURITY_AUDIT_BACKUP.md](SECURITY_AUDIT_BACKUP.md)
- **Alerts Setup**: [docs/SECURITY_ALERTS_SETUP.md](SECURITY_ALERTS_SETUP.md)
- **Production Checklist**: [docs/SECURITY_PRODUCTION_CHECKLIST.md](SECURITY_PRODUCTION_CHECKLIST.md)

---

**Last Updated**: 2026-02-19
**Version**: 1.0
