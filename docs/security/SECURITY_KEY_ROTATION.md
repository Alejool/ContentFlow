# Encryption Key Rotation Guide

## Overview

Intellipost encrypts sensitive data including social media tokens using Laravel's encryption system (AES-256-CBC). This guide covers the process of rotating encryption keys to maintain security best practices.

## Why Rotate Encryption Keys?

Regular key rotation is a security best practice that:

- **Limits exposure**: Reduces the impact if a key is compromised
- **Meets compliance**: Required by many security standards (PCI-DSS, HIPAA, etc.)
- **Reduces risk**: Limits the amount of data encrypted with a single key
- **Industry standard**: Recommended every 90-365 days depending on risk profile

## What Gets Encrypted?

Intellipost encrypts the following sensitive data:
- Social media access tokens (OAuth tokens)
- Social media refresh tokens
- Two-factor authentication secrets
- Two-factor authentication backup codes

## Pre-Rotation Checklist

Before rotating keys, ensure:

- [ ] **Full database backup** is completed and verified
- [ ] **Application is in maintenance mode** (or low-traffic period)
- [ ] **All queued jobs are processed** (check queue status)
- [ ] **You have access to the server** with appropriate permissions
- [ ] **Current `.env` file is backed up**
- [ ] **No active deployments** are in progress

## Rotation Process

### Step 1: Enable Maintenance Mode

Put the application in maintenance mode to prevent new data encryption during rotation:

```bash
php artisan down --message="System maintenance in progress" --retry=60
```

### Step 2: Backup Current State

Create a complete backup:

```bash
# Backup database
php artisan backup:run --only-db

# Backup .env file
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -lh storage/app/backups/
```

### Step 3: Run Key Rotation Command

Execute the key rotation command:

```bash
php artisan encryption:rotate
```

**What this command does**:
1. Generates a new encryption key
2. Retrieves all encrypted data from the database
3. Decrypts data using the old key
4. Re-encrypts data using the new key
5. Updates the database with re-encrypted data
6. Updates the `.env` file with the new key

**Expected output**:
```
Re-encrypting 150 social accounts...
Re-encrypting 45 user 2FA secrets...
Encryption key rotated successfully
New key: base64:NEW_KEY_HERE
```

### Step 4: Verify Rotation

Test that encrypted data is accessible:

```bash
php artisan tinker
```

```php
// Test social account token decryption
$account = App\Models\SocialAccount::first();
echo $account->access_token ? "✓ Token decryption works" : "✗ Token decryption failed";

// Test 2FA secret decryption
$admin = App\Models\User::whereNotNull('two_factor_secret')->first();
echo $admin->two_factor_secret ? "✓ 2FA decryption works" : "✗ 2FA decryption failed";
```

### Step 5: Test Application

Perform critical function tests:

1. **Login with 2FA**: Verify admin can log in with 2FA
2. **Social Publishing**: Test publishing to a social platform
3. **Token Refresh**: Verify OAuth token refresh works
4. **File Upload**: Test file upload functionality

### Step 6: Disable Maintenance Mode

If all tests pass:

```bash
php artisan up
```

## Rollback Procedure

If rotation fails or causes issues:

### Immediate Rollback

1. **Restore .env file**:
```bash
cp .env.backup.YYYYMMDD_HHMMSS .env
```

2. **Clear configuration cache**:
```bash
php artisan config:clear
php artisan cache:clear
```

3. **Verify old key works**:
```bash
php artisan tinker
```
```php
$account = App\Models\SocialAccount::first();
echo $account->access_token ? "✓ Rollback successful" : "✗ Rollback failed";
```

4. **Disable maintenance mode**:
```bash
php artisan up
```

### Full Database Rollback

If data corruption occurred:

1. **Enable maintenance mode**:
```bash
php artisan down
```

2. **Restore database backup**:
```bash
# For PostgreSQL
pg_restore -d Intellipost backup_file.dump

# For MySQL
mysql Intellipost < backup_file.sql
```

3. **Restore .env file**:
```bash
cp .env.backup.YYYYMMDD_HHMMSS .env
```

4. **Clear caches**:
```bash
php artisan config:clear
php artisan cache:clear
```

5. **Verify and re-enable**:
```bash
php artisan up
```

## Automated Rotation (Recommended)

For production environments, automate key rotation:

### Schedule Rotation

Add to `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Rotate encryption keys every 90 days at 2 AM on Sunday
    $schedule->command('encryption:rotate')
        ->quarterly()
        ->sundays()
        ->at('02:00')
        ->before(function () {
            Artisan::call('down');
            Artisan::call('backup:run --only-db');
        })
        ->after(function () {
            Artisan::call('up');
        })
        ->emailOutputOnFailure('admin@example.com');
}
```

### Monitoring

Set up alerts for rotation events:

```php
// In app/Console/Commands/RotateEncryptionKey.php
use Illuminate\Support\Facades\Notification;
use App\Notifications\KeyRotationCompleted;

// After successful rotation
Notification::route('mail', 'security@example.com')
    ->notify(new KeyRotationCompleted($accountsCount, $usersCount));
```

## Security Best Practices

### Key Storage

1. **Never commit keys to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use secure key management**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault

3. **Restrict access**
   - Limit who can access `.env` files
   - Use file permissions: `chmod 600 .env`

### Rotation Frequency

**Recommended schedules**:
- **High security**: Every 30-90 days
- **Standard**: Every 90-180 days
- **Low risk**: Every 180-365 days

**Immediate rotation required if**:
- Key compromise suspected
- Employee with key access leaves
- Security breach detected
- Compliance audit requires it

### Audit Trail

All key rotations are logged in the audit system:

```php
// View rotation history
AuditLog::where('action', 'encryption_key_rotated')
    ->orderBy('created_at', 'desc')
    ->get();
```

## Troubleshooting

### "Decryption failed" Errors

**Cause**: Data encrypted with old key, but old key not available.

**Solution**:
1. Restore `.env` backup with old key
2. Re-run rotation command
3. Verify all data is re-encrypted

### "The payload is invalid" Errors

**Cause**: Corrupted encrypted data or wrong key.

**Solution**:
1. Check if `.env` file is correct
2. Verify database backup integrity
3. Restore from backup if necessary

### Partial Rotation

**Cause**: Command interrupted mid-rotation.

**Solution**:
1. Check which records were rotated:
```php
// Records that fail to decrypt with new key need re-rotation
$accounts = SocialAccount::all();
foreach ($accounts as $account) {
    try {
        $token = $account->access_token;
    } catch (\Exception $e) {
        echo "Account {$account->id} needs re-rotation\n";
    }
}
```

2. Restore from backup and retry rotation

### Performance Issues

**Cause**: Large number of encrypted records.

**Solution**:
1. Run rotation during low-traffic periods
2. Use database transactions for safety
3. Consider chunking for very large datasets:

```php
// In RotateEncryptionKey command
SocialAccount::chunk(100, function ($accounts) use ($oldKey, $newKey) {
    foreach ($accounts as $account) {
        // Decrypt with old key, encrypt with new key
    }
});
```

## Multi-Server Environments

For applications running on multiple servers:

### Step 1: Prepare All Servers

1. Put load balancer in maintenance mode
2. Ensure all servers have the same current key
3. Stop all queue workers

### Step 2: Rotate on Primary Server

1. Run rotation command on primary server
2. Verify success

### Step 3: Update Other Servers

1. Copy new `.env` file to all servers
2. Clear configuration cache on all servers:
```bash
php artisan config:clear
```

3. Restart queue workers
4. Re-enable load balancer

## Compliance Considerations

### PCI-DSS

- Rotate keys at least annually
- Document rotation procedures
- Maintain audit trail of rotations

### HIPAA

- Rotate keys when personnel changes occur
- Document key management procedures
- Maintain encryption key inventory

### GDPR

- Ensure key rotation doesn't affect data portability
- Document encryption methods
- Maintain records of processing activities

## Emergency Procedures

### Key Compromise

If you suspect key compromise:

1. **Immediate actions**:
   - Enable maintenance mode
   - Rotate key immediately
   - Review audit logs for suspicious access
   - Notify security team

2. **Investigation**:
   - Check who accessed the key
   - Review recent deployments
   - Scan for malware
   - Check for data exfiltration

3. **Recovery**:
   - Force password reset for affected users
   - Revoke and refresh all social tokens
   - Regenerate 2FA secrets for admins
   - Document incident

### Lost Encryption Key

If the encryption key is lost:

**Prevention**: Always backup `.env` files!

**Recovery options**:
1. Restore from `.env` backup
2. Restore from configuration management system
3. If no backup exists:
   - All encrypted data is permanently lost
   - Users must re-authenticate social accounts
   - Admins must reconfigure 2FA
   - This is a catastrophic failure - prevention is critical!

## Support

For additional help:
- Review [Security Documentation](SECURITY_OVERVIEW.md)
- Check [Audit Logs](SECURITY_AUDIT_BACKUP.md)
- Contact security team
- Review Laravel encryption documentation

---

**Last Updated**: 2026-02-19
**Version**: 1.0
**Next Review**: 2026-05-19
